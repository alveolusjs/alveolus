import type { DesignDocument, Heading, TableRow, TextLine } from './design-document.ts';
import { type IdentifierKind, identifierKinds } from './identifier-kind.ts';

export type Occurrence = {
	readonly id: string;
	readonly kind: IdentifierKind;
	readonly line: number;
	readonly definition: boolean;
	readonly row: TableRow | undefined;
};

export class IdentifierIndex {
	readonly #occurrences: Occurrence[] = [];

	public constructor(document: DesignDocument) {
		const rows = new Map(document.rows.map((row) => [row.line, row]));
		const headings = new Map(document.headings.map((heading) => [heading.line, heading]));

		for (const textLine of document.textLines) {
			this.#index(textLine, rows.get(textLine.line), headings.get(textLine.line));
		}
	}

	public ids(): string[] {
		return [...new Set(this.#occurrences.map((occurrence) => occurrence.id))];
	}

	public occurrencesOf(id: string): Occurrence[] {
		return this.#occurrences.filter((occurrence) => occurrence.id === id);
	}

	public definitionsOf(prefix: string): Occurrence[] {
		return this.#occurrences.filter((occurrence) => occurrence.definition && occurrence.kind.is(prefix));
	}

	public definitions(): Occurrence[] {
		return this.#occurrences.filter((occurrence) => occurrence.definition);
	}

	#index(textLine: TextLine, row: TableRow | undefined, heading: Heading | undefined): void {
		if (textLine.mermaid) {
			this.#indexCitations(textLine);

			return;
		}

		for (const kind of identifierKinds) {
			const found = kind.find(textLine.text);

			for (const [position, id] of found.entries()) {
				const definition = found.indexOf(id) === position && this.#defines(kind, id, row, heading);
				this.#occurrences.push({ id, kind, line: textLine.line, definition, row });
			}
		}
	}

	#indexCitations(textLine: TextLine): void {
		for (const kind of identifierKinds) {
			for (const id of kind.find(textLine.text)) {
				this.#occurrences.push({ id, kind, line: textLine.line, definition: false, row: undefined });
			}
		}
	}

	#defines(kind: IdentifierKind, id: string, row: TableRow | undefined, heading: Heading | undefined): boolean {
		if (row !== undefined) {
			return !row.header && kind.isDefinedByRowIn(row.section) && this.#bare(row.cells[0] ?? '') === id;
		}

		if (heading !== undefined) {
			return heading.level > 2 && kind.isDefinedByHeadingIn(heading.section);
		}

		return false;
	}

	#bare(cell: string): string {
		return cell.replaceAll(/[`*]/g, '').trim();
	}
}
