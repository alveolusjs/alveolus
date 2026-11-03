import type { DesignDocument } from '../design-document.ts';
import type { Finding } from '../finding.ts';
import { identifierKinds } from '../identifier-kind.ts';
import type { RuleCatalog } from '../rule-catalog.ts';

const ruleCode = /(?<![\p{L}\p{N}_])([A-Z]{2,3})-\d{2}(?![\p{L}\p{N}_])/gu;
const leadingRuleCode = /^[A-Z]{2,3}-\d{2}(?![\p{L}\p{N}_])/u;

export class RuleCodeCheck {
	readonly #document: DesignDocument;
	readonly #catalog: RuleCatalog;

	public constructor(document: DesignDocument, catalog: RuleCatalog) {
		this.#document = document;
		this.#catalog = catalog;
	}

	public findings(): Finding[] {
		return [...this.#citations(), ...this.#appendix()];
	}

	#citations(): Finding[] {
		const findings: Finding[] = [];

		for (const { line, text, mermaid } of this.#document.textLines) {
			if (mermaid) {
				continue;
			}

			for (const match of text.matchAll(ruleCode)) {
				if (this.#catalog.hasPrefix(match[1] ?? '') && !this.#catalog.has(match[0])) {
					findings.push({ line, message: `${match[0]} is not an approved Alveolus rule` });
				}
			}
		}

		return findings;
	}

	#appendix(): Finding[] {
		const findings: Finding[] = [];

		for (const row of this.#document.rows) {
			if (row.section !== 'B' || row.header) {
				continue;
			}

			const cell = (row.cells[0] ?? '').replaceAll(/[`*]/g, '').trim();

			if (this.#isWaiver(cell) || this.#isRule(cell)) {
				continue;
			}

			findings.push({
				line: row.line,
				message: `appendix B lists "${cell}", which is not an approved Alveolus rule code`,
			});
		}

		return findings;
	}

	#isWaiver(cell: string): boolean {
		return identifierKinds.some((kind) => kind.is('W') && kind.find(cell).length > 0);
	}

	#isRule(cell: string): boolean {
		const code = leadingRuleCode.exec(cell)?.[0];

		return code !== undefined && this.#catalog.has(code);
	}
}
