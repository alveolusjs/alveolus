import type { DesignDocument, Fence } from '../design-document.ts';
import type { Finding } from '../finding.ts';
import type { IdentifierIndex } from '../identifier-index.ts';
import type { MermaidParser } from '../mermaid-parser.ts';

export type DiagramReport = {
	readonly findings: readonly Finding[];
	readonly notices: readonly string[];
};

type ExpectedDiagram = {
	readonly section: string;
	readonly types: readonly string[];
	readonly when: 'always' | 'AGG' | 'TBL';
	readonly message: string;
};

const expectedDiagrams: readonly ExpectedDiagram[] = [
	{
		section: 'summary',
		types: ['flowchart', 'graph'],
		when: 'always',
		message: 'the summary has no context map: a Mermaid flowchart',
	},
	{
		section: '7',
		types: ['classDiagram'],
		when: 'AGG',
		message: 'section 7 defines an aggregate but has no Mermaid classDiagram',
	},
	{
		section: '11',
		types: ['erDiagram'],
		when: 'TBL',
		message: 'section 11 defines a table but has no Mermaid erDiagram',
	},
];

export class DiagramCheck {
	readonly #document: DesignDocument;
	readonly #index: IdentifierIndex;
	readonly #parser: MermaidParser | undefined;

	public constructor(document: DesignDocument, index: IdentifierIndex, parser: MermaidParser | undefined) {
		this.#document = document;
		this.#index = index;
		this.#parser = parser;
	}

	public async report(): Promise<DiagramReport> {
		const parsed = await this.#parsed();

		return { findings: [...this.#expected(), ...parsed.findings], notices: parsed.notices };
	}

	#expected(): Finding[] {
		const findings: Finding[] = [];

		for (const diagram of expectedDiagrams) {
			const section = this.#document.sections.find((candidate) => candidate.id === diagram.section);

			if (section === undefined || !this.#applies(diagram) || this.#has(diagram)) {
				continue;
			}

			findings.push({ line: section.line, message: diagram.message });
		}

		return findings;
	}

	#applies(diagram: ExpectedDiagram): boolean {
		return diagram.when === 'always' || this.#index.definitionsOf(diagram.when).length > 0;
	}

	#has(diagram: ExpectedDiagram): boolean {
		return this.#diagrams().some(
			(fence) => fence.section === diagram.section && diagram.types.includes(this.#typeOf(fence)),
		);
	}

	async #parsed(): Promise<DiagramReport> {
		if (this.#parser === undefined) {
			const notices = this.#diagrams().length === 0 ? [] : [this.#notInstalled()];

			return { findings: [], notices };
		}

		const findings: Finding[] = [];
		const notices: string[] = [];

		for (const fence of this.#diagrams()) {
			const outcome = await this.#parser.parse(fence.body);

			if (outcome.kind === 'invalid') {
				findings.push({
					line: fence.line + outcome.line,
					message: `the Mermaid diagram does not parse: ${outcome.message}`,
				});
			}

			if (outcome.kind === 'unchecked') {
				notices.push(`the Mermaid diagram at line ${fence.line} could not be checked: ${outcome.reason}`);
			}
		}

		return { findings, notices };
	}

	#diagrams(): Fence[] {
		return this.#document.fences.filter((fence) => fence.language === 'mermaid');
	}

	#typeOf(fence: Fence): string {
		const first = fence.body
			.split('\n')
			.map((line) => line.trim())
			.find((line) => line !== '' && !line.startsWith('%%'));

		return first?.split(/\s/)[0] ?? '';
	}

	#notInstalled(): string {
		return 'Mermaid diagrams not checked: add mermaid and happy-dom to the dev dependencies to check them';
	}
}
