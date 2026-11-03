import { parse } from 'yaml';

export type Heading = {
	readonly line: number;
	readonly level: number;
	readonly text: string;
	readonly section: string | undefined;
};

export type Section = {
	readonly id: string;
	readonly line: number;
	readonly hasContent: boolean;
};

export type TableRow = {
	readonly line: number;
	readonly cells: readonly string[];
	readonly section: string | undefined;
	readonly header: boolean;
};

export type Table = {
	readonly line: number;
	readonly rows: number;
};

export type Fence = {
	readonly line: number;
	readonly language: string;
	readonly body: string;
	readonly section: string | undefined;
};

export type TextLine = {
	readonly line: number;
	readonly text: string;
	readonly section: string | undefined;
	readonly mermaid: boolean;
};

export type Frontmatter = {
	readonly data: unknown;
	readonly error: string | undefined;
	readonly keyLines: ReadonlyMap<string, number>;
	readonly values: readonly TextLine[];
};

type OpenFence = {
	readonly line: number;
	readonly marker: string;
	readonly language: string;
	readonly body: string[];
};

type OpenSection = {
	readonly id: string;
	readonly line: number;
	hasContent: boolean;
};

type OpenRow = {
	readonly line: number;
	readonly cells: readonly string[];
	readonly section: string | undefined;
	header: boolean;
};

type OpenTable = {
	readonly line: number;
	rows: number;
};

const fenceOpening = /^\s{0,3}(`{3,}|~{3,})\s*([^\s`]*)/;
const headingPattern = /^(#{1,6})\s+(.+?)\s*$/;
const numberedSection = /^(\d{1,2}|[A-Z])\.\s/;
const separatorRow = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/;

export class DesignDocument {
	readonly #lines: readonly string[];
	readonly #headings: Heading[] = [];
	readonly #sections: OpenSection[] = [];
	readonly #rows: OpenRow[] = [];
	readonly #tables: OpenTable[] = [];
	readonly #fences: Fence[] = [];
	readonly #textLines: TextLine[] = [];
	readonly #commentLines: number[] = [];
	readonly #frontmatter: Frontmatter | undefined;
	#current: OpenSection | undefined;
	#table: OpenTable | undefined;
	#titleLine: number | undefined;

	public constructor(text: string) {
		this.#lines = text.split(/\r?\n/);
		this.#frontmatter = this.#readFrontmatter();
		this.#scan(this.#frontmatter === undefined ? 0 : this.#frontmatter.values.length + 2);
	}

	public get frontmatter(): Frontmatter | undefined {
		return this.#frontmatter;
	}

	public get titleLine(): number | undefined {
		return this.#titleLine;
	}

	public get headings(): readonly Heading[] {
		return this.#headings;
	}

	public get sections(): readonly Section[] {
		return this.#sections;
	}

	public get rows(): readonly TableRow[] {
		return this.#rows;
	}

	public get tables(): readonly Table[] {
		return this.#tables;
	}

	public get fences(): readonly Fence[] {
		return this.#fences;
	}

	public get textLines(): readonly TextLine[] {
		return this.#textLines;
	}

	public get commentLines(): readonly number[] {
		return this.#commentLines;
	}

	#readFrontmatter(): Frontmatter | undefined {
		if (this.#lines[0]?.trim() !== '---') {
			return undefined;
		}

		const end = this.#lines.findIndex((line, index) => index > 0 && line.trim() === '---');

		if (end === -1) {
			return undefined;
		}

		const raw = this.#lines.slice(1, end);
		const values = raw.map((text, index) => ({ line: index + 2, text, section: undefined, mermaid: false }));
		const keyLines = new Map<string, number>();

		for (const { line, text } of values) {
			const key = /^([\w-]+):/.exec(text)?.[1];

			if (key !== undefined && !keyLines.has(key)) {
				keyLines.set(key, line);
			}
		}

		try {
			return { data: parse(raw.join('\n')), error: undefined, keyLines, values };
		} catch (error) {
			return { data: undefined, error: String(error), keyLines, values };
		}
	}

	#scan(start: number): void {
		let inComment = false;
		let fence: OpenFence | undefined;

		for (let index = start; index < this.#lines.length; index += 1) {
			const raw = this.#lines[index] ?? '';
			const line = index + 1;

			if (fence !== undefined) {
				if (this.#closes(raw, fence)) {
					this.#fences.push({
						line: fence.line,
						language: fence.language,
						body: fence.body.join('\n'),
						section: this.#current?.id,
					});
					fence = undefined;
				} else {
					fence.body.push(raw);

					if (fence.language === 'mermaid') {
						this.#textLines.push({ line, text: raw, section: this.#current?.id, mermaid: true });
					}
				}

				continue;
			}

			const visible = this.#withoutComments(raw, line, inComment);
			inComment = visible.inComment;

			const opening = fenceOpening.exec(visible.text);

			if (opening !== null) {
				fence = { line, marker: opening[1] ?? '```', language: opening[2] ?? '', body: [] };
				this.#table = undefined;
				this.#markContent();
				continue;
			}

			this.#read(visible.text, line);
		}
	}

	#closes(raw: string, fence: OpenFence): boolean {
		const trimmed = raw.trim();

		return trimmed.startsWith(fence.marker) && /^(`+|~+)$/.test(trimmed) && trimmed[0] === fence.marker[0];
	}

	#withoutComments(raw: string, line: number, inComment: boolean): { text: string; inComment: boolean } {
		let rest = raw;
		let text = '';
		let open = inComment;

		while (true) {
			if (open) {
				const close = rest.indexOf('-->');

				if (close === -1) {
					return { text, inComment: true };
				}

				rest = rest.slice(close + 3);
				open = false;
				continue;
			}

			const start = rest.indexOf('<!--');

			if (start === -1) {
				return { text: text + rest, inComment: false };
			}

			this.#commentLines.push(line);
			text += rest.slice(0, start);
			rest = rest.slice(start + 4);
			open = true;
		}
	}

	#read(text: string, line: number): void {
		if (text.trim().startsWith('|')) {
			this.#markContent();
			this.#textLines.push({ line, text, section: this.#current?.id, mermaid: false });
			this.#readRow(text.trim(), line);

			return;
		}

		this.#table = undefined;

		const heading = headingPattern.exec(text);

		if (heading !== null) {
			this.#readHeading((heading[1] ?? '').length, heading[2] ?? '', line);
			this.#textLines.push({ line, text, section: this.#current?.id, mermaid: false });

			return;
		}

		if (text.trim() === '') {
			return;
		}

		this.#markContent();
		this.#textLines.push({ line, text, section: this.#current?.id, mermaid: false });
	}

	#readHeading(level: number, text: string, line: number): void {
		if (level === 1) {
			this.#titleLine ??= line;
			this.#current = undefined;
		}

		if (level === 2) {
			this.#current = this.#openSection(text, line);
		}

		this.#headings.push({ line, level, text, section: this.#current?.id });
	}

	#openSection(text: string, line: number): OpenSection | undefined {
		const number = numberedSection.exec(text)?.[1];
		const summaryIsOpen =
			this.#titleLine !== undefined &&
			!this.#sections.some((section) => section.id === 'summary' || section.id === '1');
		const id = number ?? (summaryIsOpen ? 'summary' : undefined);

		if (id === undefined) {
			return undefined;
		}

		const section = { id, line, hasContent: false };
		this.#sections.push(section);

		return section;
	}

	#readRow(text: string, line: number): void {
		if (separatorRow.test(text)) {
			const previous = this.#rows.at(-1);

			if (previous !== undefined && previous.line === line - 1) {
				previous.header = true;
				this.#table = { line: previous.line, rows: 0 };
				this.#tables.push(this.#table);
			}

			return;
		}

		const cells = text
			.replace(/^\|/, '')
			.replace(/(?<!\\)\|$/, '')
			.split(/(?<!\\)\|/)
			.map((cell) => cell.trim());

		this.#rows.push({ line, cells, section: this.#current?.id, header: false });

		if (this.#table !== undefined) {
			this.#table.rows += 1;
		}
	}

	#markContent(): void {
		if (this.#current !== undefined) {
			this.#current.hasContent = true;
		}
	}
}
