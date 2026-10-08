import type { Codebase, CodeClass, CodeFile } from "../codebase/index.ts";
import type { Problem } from "./problem.ts";
import { Rule } from "./rule.ts";
import type { Violation } from "./violation.ts";

export abstract class ClassRule extends Rule {
	public check(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			for (const codeClass of file.classes) {
				for (const problem of this.problemsWith(codeClass, file, codebase)) {
					violations.push(this.violation(codebase, file, problem));
				}
			}
		}
		return violations;
	}

	protected abstract problemsWith(codeClass: CodeClass, file: CodeFile, codebase: Codebase): Problem[];
}
