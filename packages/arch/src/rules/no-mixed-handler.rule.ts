import type { CodeClass, CoreKind } from "../codebase/index.ts";
import type { RuleId } from "../config/index.ts";
import { ClassRule } from "./class-rule.ts";
import type { Problem } from "./problem.ts";

interface Separation {
	readonly handler: CoreKind;
	readonly forbidden: readonly CoreKind[];
}

const separations: readonly Separation[] = [
	{ forbidden: ["QueryRepository"], handler: "CommandHandler" },
	{ forbidden: ["CommandRepository", "Outbox", "UnitOfWork", "EventPublisher"], handler: "QueryHandler" },
];

export class NoMixedHandlerRule extends ClassRule {
	public readonly id: RuleId = "tactical/no-mixed-handler";

	protected problemsWith(codeClass: CodeClass): Problem[] {
		const problems: Problem[] = [];
		for (const { handler, forbidden } of separations) {
			if (!codeClass.is(handler)) {
				continue;
			}
			for (const parameter of codeClass.constructorParameters) {
				const kind = forbidden.find((candidate) => parameter.is(candidate));
				if (kind !== undefined) {
					problems.push({
						line: parameter.line,
						message: `The ${handler} ${codeClass.name} receives ${parameter.typeName}, a ${kind}: keep commands and queries apart.`,
						symbol: `${codeClass.name}.${parameter.member}`,
					});
				}
			}
		}
		return problems;
	}
}
