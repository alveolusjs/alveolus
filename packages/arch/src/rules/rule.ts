import type { Codebase, CodeFile } from "../codebase/index.ts";
import type { RuleId } from "../config/index.ts";
import { Fingerprint } from "./fingerprint.ts";
import type { Problem } from "./problem.ts";
import type { Violation } from "./violation.ts";

export abstract class Rule {
	public abstract readonly id: RuleId;

	public abstract check(codebase: Codebase): Violation[];

	protected violation(codebase: Codebase, file: CodeFile, problem: Problem): Violation {
		return {
			file: codebase.relativePath(file.path),
			fingerprint: Fingerprint.of(file.lineText(problem.line)),
			line: problem.line,
			message: problem.message,
			rule: this.id,
			symbol: problem.symbol,
		};
	}
}
