import type { RuleId } from "../config/index.ts";

export interface Violation {
	readonly rule: RuleId;
	readonly file: string;
	readonly line: number;
	readonly symbol: string;
	readonly message: string;
}
