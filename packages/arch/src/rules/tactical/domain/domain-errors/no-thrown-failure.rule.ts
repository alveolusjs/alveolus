import type { Codebase, CodeFile, Layer, Method, Throw } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import type { Problem } from "../../../problem.ts";
import { Rule } from "../../../rule.ts";
import type { Violation } from "../../../violation.ts";

const exempt: ReadonlySet<string> = new Set(["equals", "toSnapshot"]);

/** Adapters may still throw: a lost connection is no business failure. */
const guarded: ReadonlySet<Layer | undefined> = new Set<Layer>(["domain", "application"]);

export class NoThrownFailureRule extends Rule {
	public readonly id: RuleId = "tactical/no-thrown-failure";

	public check(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			for (const problem of [...this.methodsWithoutResult(file), ...this.thrownFailures(file)]) {
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
					problems.push({ line: method.line, message: this.messageFor(`${codeClass.name}.${method.name}`, method), symbol: `${codeClass.name}.${method.name}` });
				}
			}
		}
		return problems;
	}

	private messageFor(name: string, method: Method): string {
		if (method.kind === "setter") {
			return `${name} is a setter: change the state through a business method that returns a Result.`;
		}
		return `${name} must return a Result: expose reads as getters and return business failures as values.`;
	}

	private thrownFailures(file: CodeFile): Problem[] {
		if (!guarded.has(file.location.layer)) {
			return [];
		}
		return file.throws.map((thrown) => ({ line: thrown.line, message: this.throwMessage(thrown), symbol: thrown.form }));
	}

	private throwMessage(thrown: Throw): string {
		if (thrown.form === "Promise.reject") {
			return "A failure is rejected: return it in a Result instead.";
		}
		return "A failure is thrown: return it in a Result instead.";
	}
}
