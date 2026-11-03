import { DiagramCheck } from './checks/diagram-check.ts';
import { FrontmatterCheck } from './checks/frontmatter-check.ts';
import { IdentifierCheck } from './checks/identifier-check.ts';
import { LeftoverCheck } from './checks/leftover-check.ts';
import { RuleCodeCheck } from './checks/rule-code-check.ts';
import { SectionCheck } from './checks/section-check.ts';
import { DesignDocument } from './design-document.ts';
import type { Finding } from './finding.ts';
import { IdentifierIndex } from './identifier-index.ts';
import type { MermaidParser } from './mermaid-parser.ts';
import type { RuleCatalog } from './rule-catalog.ts';

export type DesignReport = {
	readonly findings: readonly Finding[];
	readonly notices: readonly string[];
};

export class DesignCheck {
	readonly #catalog: RuleCatalog;
	readonly #parser: MermaidParser | undefined;

	public constructor(catalog: RuleCatalog, parser: MermaidParser | undefined) {
		this.#catalog = catalog;
		this.#parser = parser;
	}

	public async run(text: string): Promise<DesignReport> {
		const document = new DesignDocument(text);
		const index = new IdentifierIndex(document);
		const diagrams = await new DiagramCheck(document, index, this.#parser).report();
		const findings = [
			...new FrontmatterCheck(document).findings(),
			...new SectionCheck(document).findings(),
			...new LeftoverCheck(document).findings(),
			...new IdentifierCheck(index).findings(),
			...new RuleCodeCheck(document, this.#catalog).findings(),
			...diagrams.findings,
		];

		return { findings: findings.toSorted((left, right) => left.line - right.line), notices: diagrams.notices };
	}
}
