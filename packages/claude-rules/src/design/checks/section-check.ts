import type { DesignDocument, Section } from '../design-document.ts';
import type { Finding } from '../finding.ts';

const expected = [
	'summary',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'10',
	'11',
	'12',
	'13',
	'14',
	'15',
	'A',
	'B',
	'C',
];

export class SectionCheck {
	readonly #document: DesignDocument;

	public constructor(document: DesignDocument) {
		this.#document = document;
	}

	public findings(): Finding[] {
		if (this.#document.titleLine === undefined) {
			return [{ line: 1, message: 'the design has no title: a "#" heading after the frontmatter' }];
		}

		return [...this.#presence(this.#document.titleLine), ...this.#order(), ...this.#content(), ...this.#tables()];
	}

	#presence(titleLine: number): Finding[] {
		const findings: Finding[] = [];

		for (const id of expected) {
			const found = this.#document.sections.filter((section) => section.id === id);
			const [, second] = found;

			if (found.length === 0) {
				findings.push({ line: titleLine, message: `${this.#label(id)} is missing` });
			}

			if (second !== undefined) {
				findings.push({ line: second.line, message: `${this.#label(id)} appears ${found.length} times` });
			}
		}

		return findings;
	}

	#order(): Finding[] {
		const findings: Finding[] = [];
		let furthest = -1;

		for (const section of this.#document.sections) {
			const position = expected.indexOf(section.id);

			if (position === -1) {
				findings.push({ line: section.line, message: `${this.#label(section.id)} is not in the template` });
				continue;
			}

			if (position < furthest) {
				findings.push({ line: section.line, message: `${this.#label(section.id)} is out of order` });
			}

			furthest = Math.max(furthest, position);
		}

		return findings;
	}

	#content(): Finding[] {
		return this.#document.sections
			.filter((section) => !section.hasContent)
			.map((section: Section) => ({
				line: section.line,
				message: `${this.#label(section.id)} is empty: write "None." when there is nothing to say`,
			}));
	}

	#tables(): Finding[] {
		return this.#document.tables
			.filter((table) => table.rows === 0)
			.map((table) => ({
				line: table.line,
				message: 'the table has no rows: fill it, or write "None." in its place',
			}));
	}

	#label(id: string): string {
		if (id === 'summary') {
			return 'the summary';
		}

		return /^\d+$/.test(id) ? `section ${id}` : `appendix ${id}`;
	}
}
