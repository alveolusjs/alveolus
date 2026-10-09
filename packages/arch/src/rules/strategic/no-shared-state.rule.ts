import type { Architecture } from "../../architecture/index.ts";
import type { ClassDeclaration, Member, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { ClassRule } from "../framework/index.ts";

type MessageId = "mutable" | "collection";

export class NoSharedStateRule extends ClassRule<"strategic/no-shared-state", MessageId> {
	public readonly meta: RuleMeta<"strategic/no-shared-state", MessageId> = {
		contexts: "every",
		description: "A static field of the shared kernel that holds state: one without readonly, or one holding a collection.",
		id: "strategic/no-shared-state",
		messages: {
			collection:
				"{class}.{field} holds a collection in a static field: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
			mutable:
				"{class}.{field} is a static field without readonly: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
		},
	};

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<MessageId>[] {
		if (!architecture.locationOf(file).isInSharedKernel) {
			return [];
		}
		const findings: Finding<MessageId>[] = [];
		for (const member of codeClass.members) {
			const messageId = this.stateOf(member);
			if (messageId !== undefined) {
				findings.push(this.finding(file, member.line, member.name, messageId, { class: codeClass.name, field: member.name }));
			}
		}
		return findings;
	}

	private stateOf(member: Member): MessageId | undefined {
		if (!member.isStatic || member.kind !== "field") {
			return undefined;
		}
		if (!member.isReadonly) {
			return "mutable";
		}
		return member.holdsCollection ? "collection" : undefined;
	}
}
