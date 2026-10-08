import type { CodeClass, CoreKind, TypeUsage } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import { DependencyRule } from "../../../dependency-rule.ts";

export class NoForeignCommandDependencyRule extends DependencyRule {
	public readonly id: RuleId = "tactical/no-foreign-command-dependency";
	protected readonly holder: CoreKind = "CommandHandler";
	protected readonly forbidden: readonly CoreKind[] = ["QueryRepository"];
	protected readonly allowed: readonly CoreKind[] = ["CommandRepository", "Port", "EventTranslator", "DomainService", "ValueObject", "Identifier"];

	protected messageFor(codeClass: CodeClass, member: TypeUsage, kind: string): string {
		return `The CommandHandler ${codeClass.name} receives ${member.typeName}, ${kind}: a command handler receives command repositories, ports, event translators, domain services and value objects.`;
	}
}
