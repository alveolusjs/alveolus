const tabWidth = 4;

export type Span = {
	readonly line: number;
	readonly column: number;
	readonly length: number;
};

export class CodeFrame {
	readonly #path: string;
	readonly #lines: readonly string[];

	public constructor(path: string, text: string) {
		this.#path = path;
		this.#lines = text.split(/\r?\n/);
	}

	public locate(specifier: string): Span | undefined {
		for (const [index, text] of this.#lines.entries()) {
			for (const quote of [`'`, `"`, '`']) {
				const column = text.indexOf(`${quote}${specifier}${quote}`);

				if (column !== -1) {
					return { line: index + 1, column: column + 1, length: specifier.length + 2 };
				}
			}
		}

		return undefined;
	}

	public span(line: number, column: number, endLine?: number, endColumn?: number): Span {
		const text = this.#lines[line - 1] ?? '';
		const end = endLine === line && endColumn !== undefined ? endColumn : text.length + 1;

		return { line, column, length: Math.max(end - column, 1) };
	}

	public render(span: Span, label?: string): string[] {
		const first = Math.max(span.line - 1, 1);
		const last = Math.min(span.line + 1, this.#lines.length);
		const width = String(last).length;
		const margin = ' '.repeat(width + 2);
		const rows = [`${margin}╭─[${this.#path}:${span.line}:${span.column}]`];

		for (let line = first; line <= last; line += 1) {
			rows.push(` ${String(line).padStart(width)} │ ${this.#expand(this.#lines[line - 1] ?? '')}`.trimEnd());

			if (line === span.line) {
				rows.push(...this.#underline(span, label, margin));
			}
		}

		rows.push(`${margin}╰────`);

		return rows;
	}

	#underline(span: Span, label: string | undefined, margin: string): string[] {
		const start = this.#expand((this.#lines[span.line - 1] ?? '').slice(0, span.column - 1)).length;

		if (label === undefined) {
			return [`${margin}· ${' '.repeat(start)}${'─'.repeat(span.length)}`];
		}

		const middle = Math.floor(span.length / 2);
		const line = `${'─'.repeat(middle)}┬${'─'.repeat(span.length - middle - 1)}`;

		return [`${margin}· ${' '.repeat(start)}${line}`, `${margin}· ${' '.repeat(start + middle)}╰── ${label}`];
	}

	#expand(text: string): string {
		return text.replaceAll('\t', ' '.repeat(tabWidth));
	}
}
