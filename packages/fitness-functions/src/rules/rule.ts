import type { RuleCode } from './rule-code.ts';

export class Rule {
	public constructor(
		public readonly code: RuleCode,
		public readonly title: string,
		public readonly url: string,
	) {}
}
