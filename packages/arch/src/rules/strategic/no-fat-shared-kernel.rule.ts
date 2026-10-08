import type { Architecture } from "../../architecture/index.ts";
import type { CoreKind } from "../../conventions/index.ts";
import type { ClassDeclaration, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { ClassRule } from "../framework/index.ts";

const owned: readonly CoreKind[] = ["AggregateRoot", "Entity", "DomainEvent", "DomainService", "CommandRepository", "QueryRepository", "CommandHandler", "QueryHandler", "EventTranslator"];

export class NoFatSharedKernelRule extends ClassRule<"strategic/no-fat-shared-kernel", "owned"> {
	public readonly meta: RuleMeta<"strategic/no-fat-shared-kernel", "owned"> = {
		description: "An aggregate, an entity, an event, a domain service, a repository or a handler in the shared kernel.",
		id: "strategic/no-fat-shared-kernel",
		messages: {
			owned: "{class} is {kind} in the shared kernel: it belongs to one bounded context; the shared kernel holds value objects, ports and their adapters.",
		},
	};

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<"owned">[] {
		if (!architecture.locationOf(file).isInSharedKernel) {
			return [];
		}
		const kind = architecture.kindsOf(codeClass).find((candidate) => owned.includes(candidate));
		if (kind === undefined) {
			return [];
		}
		const article = /^[AEIO]/.test(kind) ? "an" : "a";
		return [this.finding(file, codeClass.line, codeClass.name, "owned", { class: codeClass.name, kind: `${article} ${kind}` })];
	}
}
