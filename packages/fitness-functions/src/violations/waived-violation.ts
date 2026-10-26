import type { RuleCode } from '../rules/rule-code.ts';
import type { Violation } from './violation.ts';

export class WaivedViolation {
	public readonly code: RuleCode;
	public readonly title: string;
	public readonly url: string;
	public readonly file: string;
	public readonly line: number;
	public readonly message: string;

	public constructor(
		violation: Violation,
		public readonly reason: string,
	) {
		this.code = violation.code;
		this.title = violation.title;
		this.url = violation.url;
		this.file = violation.file;
		this.line = violation.line;
		this.message = violation.message;
	}
}
