import type { CoreKind } from "../../../conventions/index.ts";
import type { RuleMeta } from "../../framework/index.ts";
import { InjectionRule } from "../../framework/index.ts";

export class NoForeignCommandDependencyRule extends InjectionRule<"tactical/no-foreign-command-dependency"> {
	public readonly meta: RuleMeta<"tactical/no-foreign-command-dependency", "foreign"> = {
		contexts: "core",
		description: "A command handler receiving a query repository, an event publisher, another handler or a plain class.",
		id: "tactical/no-foreign-command-dependency",
		messages: {
			foreign:
				"The CommandHandler {class} receives {type}, {kind}: a command handler receives command repositories, ports, event translators, domain services and value objects; events leave through the outbox, never a publisher.",
		},
	};

	protected readonly holder: CoreKind = "CommandHandler";
	protected readonly forbidden: readonly CoreKind[] = ["QueryRepository", "EventPublisher"];
	protected readonly allowed: readonly CoreKind[] = ["CommandRepository", "Port", "EventTranslator", "DomainService", "ValueObject", "Identifier"];
}
