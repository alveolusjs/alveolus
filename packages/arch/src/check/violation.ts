import type { RuleId } from "../rules/index.ts";

export type Severity = "error" | "warn" | "info";

export interface Violation {
	readonly rule: RuleId;
	readonly severity: Severity;
	readonly file: string;
	readonly line: number;
	readonly symbol: string;
	readonly message: string;
	readonly fingerprint: string;
}
