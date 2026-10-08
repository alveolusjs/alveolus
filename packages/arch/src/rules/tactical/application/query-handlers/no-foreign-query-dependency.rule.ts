import type { CodeClass, CoreKind, TypeUsage } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import { DependencyRule } from "../../../dependency-rule.ts";

export class NoForeignQueryDependencyRule extends DependencyRule {
	public readonly id: RuleId = "tactical/no-foreign-query-dependency";
	protected readonly holder: CoreKind = "QueryHandler";
	protected readonly forbidden: readonly CoreKind[] = ["CommandRepository", "Outbox", "UnitOfWork", "EventPublisher"];
	protected readonly allowed: readonly CoreKind[] = ["QueryRepository", "Port", "ValueObject", "Identifier"];

	protected messageFor(codeClass: CodeClass, member: TypeUsage, kind: string): string {
		return `The QueryHandler ${codeClass.name} receives ${member.typeName}, ${kind}: a query handler receives query repositories, ports that do not write, and value objects.`;
	}
}
