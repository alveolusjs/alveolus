import type { CodeClass, TypeUsage } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import { ClassRule } from "../../../class-rule.ts";
import type { Problem } from "../../../problem.ts";

export class NoAggregateReferenceRule extends ClassRule {
	public readonly id: RuleId = "tactical/no-aggregate-reference";

	protected problemsWith(codeClass: CodeClass): Problem[] {
		if (!codeClass.is("Entity")) {
			return [];
		}
		return this.membersOf(codeClass)
			.filter((member) => member.is("AggregateRoot"))
			.map((member) => ({
				line: member.line,
				message: `${codeClass.name}.${member.member} holds the aggregate ${member.typeName}: reference it by its identifier instead.`,
				symbol: `${codeClass.name}.${member.member}`,
			}));
	}

	private membersOf(codeClass: CodeClass): TypeUsage[] {
		const byName = new Map<string, TypeUsage>();
		for (const member of [...codeClass.fields, ...codeClass.constructorParameters]) {
			byName.set(`${member.member}:${member.typeName}`, member);
		}
		return [...byName.values()];
	}
}
