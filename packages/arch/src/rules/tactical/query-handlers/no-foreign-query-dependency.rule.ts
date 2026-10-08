import type { CoreKind } from "../../../conventions/index.ts";
import type { RuleMeta } from "../../framework/index.ts";
import { InjectionRule } from "../../framework/index.ts";

export class NoForeignQueryDependencyRule extends InjectionRule<"tactical/no-foreign-query-dependency"> {
	public readonly meta: RuleMeta<"tactical/no-foreign-query-dependency", "foreign"> = {
		description: "A query handler receiving what writes or changes state.",
		id: "tactical/no-foreign-query-dependency",
		messages: {
			foreign: "The QueryHandler {class} receives {type}, {kind}: a query handler receives query repositories, ports that do not write, and value objects.",
		},
	};

	protected readonly holder: CoreKind = "QueryHandler";
	protected readonly forbidden: readonly CoreKind[] = ["CommandRepository", "Outbox", "UnitOfWork", "EventPublisher"];
	protected readonly allowed: readonly CoreKind[] = ["QueryRepository", "Port", "ValueObject", "Identifier"];
}
