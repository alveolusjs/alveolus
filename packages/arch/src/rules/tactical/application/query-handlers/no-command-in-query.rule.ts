import type { CodeClass, CoreKind } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import { ClassRule } from "../../../class-rule.ts";
import type { Problem } from "../../../problem.ts";

const writers: readonly CoreKind[] = ["CommandRepository", "Outbox", "UnitOfWork", "EventPublisher"];

export class NoCommandInQueryRule extends ClassRule {
	public readonly id: RuleId = "tactical/no-command-in-query";

	protected problemsWith(codeClass: CodeClass): Problem[] {
		if (!codeClass.is("QueryHandler")) {
			return [];
		}
		const problems: Problem[] = [];
		for (const parameter of codeClass.constructorParameters) {
			const kind = writers.find((candidate) => parameter.is(candidate));
			if (kind !== undefined) {
				problems.push({
					line: parameter.line,
					message: `The QueryHandler ${codeClass.name} receives ${parameter.typeName}, a ${kind}: a query reads views and writes nothing.`,
					symbol: `${codeClass.name}.${parameter.member}`,
				});
			}
		}
		return problems;
	}
}
