import type { CodeClass, CoreKind, TypeUsage } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import { DependencyRule } from "../../../dependency-rule.ts";

export class NoStatefulServiceRule extends DependencyRule {
	public readonly id: RuleId = "tactical/no-stateful-service";
	protected readonly holder: CoreKind = "DomainService";
	protected readonly forbidden: readonly CoreKind[] = [];
	protected readonly allowed: readonly CoreKind[] = ["ValueObject", "Identifier"];

	protected messageFor(codeClass: CodeClass, member: TypeUsage, kind: string): string {
		return `The DomainService ${codeClass.name} holds ${member.typeName}, ${kind}: a domain service holds configuration only; the command handler passes it what it needs.`;
	}
}
