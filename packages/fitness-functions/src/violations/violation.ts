import type { Rule } from '../rules/rule.ts';
import type { RuleCode } from '../rules/rule-code.ts';

export class Violation {
	public readonly code: RuleCode;
	public readonly title: string;
	public readonly url: string;

	public constructor(
		rule: Rule,
		public readonly file: string,
		public readonly line: number,
		public readonly message: string,
	) {
		this.code = rule.code;
		this.title = rule.title;
		this.url = rule.url;
	}

	public toString(): string {
		return `${this.file}:${this.line} ${this.code} ${this.message}`;
	}
}
