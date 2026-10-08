import type { CodeClass } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import { ClassRule } from "../../../class-rule.ts";
import type { Problem } from "../../../problem.ts";

export class NoQueryInCommandRule extends ClassRule {
	public readonly id: RuleId = "tactical/no-query-in-command";

	protected problemsWith(codeClass: CodeClass): Problem[] {
		if (!codeClass.is("CommandHandler")) {
			return [];
		}
		return codeClass.constructorParameters
			.filter((parameter) => parameter.is("QueryRepository"))
			.map((parameter) => ({
				line: parameter.line,
				message: `The CommandHandler ${codeClass.name} receives ${parameter.typeName}, a QueryRepository: decide from the aggregate, through a CommandRepository.`,
				symbol: `${codeClass.name}.${parameter.member}`,
			}));
	}
}
