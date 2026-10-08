import type { CoreKind } from "../../../conventions/index.ts";
import type { RuleMeta } from "../../framework/index.ts";
import { InjectionRule } from "../../framework/index.ts";

export class NoStatefulServiceRule extends InjectionRule<"tactical/no-stateful-service"> {
	public readonly meta: RuleMeta<"tactical/no-stateful-service", "foreign"> = {
		description: "A domain service holding a port, a repository or another service.",
		id: "tactical/no-stateful-service",
		messages: {
			foreign: "The DomainService {class} holds {type}, {kind}: a domain service holds configuration only; the command handler passes it what it needs.",
		},
	};

	protected readonly holder: CoreKind = "DomainService";
	protected readonly forbidden: readonly CoreKind[] = [];
	protected readonly allowed: readonly CoreKind[] = ["ValueObject", "Identifier"];
}
