import type { RuleId } from "../rules/index.ts";

/** A finding as the engine reports it: located, explained, and fingerprinted for the baseline. */
export interface Violation {
	readonly rule: RuleId;
	/** Relative to the project, with forward slashes. */
	readonly file: string;
	readonly line: number;
	readonly symbol: string;
	readonly message: string;
	/** Identifies the reported line by its text, for the baseline. */
	readonly fingerprint: string;
}
