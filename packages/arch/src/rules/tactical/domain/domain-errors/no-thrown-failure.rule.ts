import type { Codebase, CodeFile } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import type { Problem } from "../../../problem.ts";
import { Rule } from "../../../rule.ts";
import type { Violation } from "../../../violation.ts";

const exempt: ReadonlySet<string> = new Set(["equals", "toSnapshot"]);

export class NoThrownFailureRule extends Rule {
	public readonly id: RuleId = "tactical/no-thrown-failure";

	public check(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			for (const problem of [...this.methodsWithoutResult(file), ...this.thrownErrors(file)]) {
				violations.push(this.violation(codebase, file, problem));
			}
		}
		return violations;
	}

	private methodsWithoutResult(file: CodeFile): Problem[] {
		const problems: Problem[] = [];
		for (const codeClass of file.classes.filter((candidate) => candidate.is("Entity"))) {
			for (const method of codeClass.publicMethods) {
				if (!exempt.has(method.name) && !method.returnsResult) {
					problems.push({
						line: method.line,
						message: `${codeClass.name}.${method.name} must return a Result: expose reads as getters and return business failures as values.`,
						symbol: `${codeClass.name}.${method.name}`,
					});
				}
			}
		}
		return problems;
	}

	private thrownErrors(file: CodeFile): Problem[] {
		return file.domainErrorThrows.map((line) => ({ line, message: "A DomainError is thrown: return it in a Result instead.", symbol: "throw" }));
	}
}
