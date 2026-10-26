import type { ImplementationStyle } from '../layout/style.ts';
import type { Coverage, RuleCoverage } from './coverage.ts';
import type { RuleCode } from './rule-code.ts';

export class Rule {
	public readonly coverage: Coverage;
	public readonly checks: string;

	public constructor(
		public readonly code: RuleCode,
		public readonly title: string,
		public readonly url: string,
		public readonly styles: readonly ImplementationStyle[],
		{ coverage, checks }: RuleCoverage,
	) {
		this.coverage = coverage;
		this.checks = checks;
	}
}
