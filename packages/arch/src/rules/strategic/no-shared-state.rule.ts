import type { Architecture } from "../../architecture/index.ts";
import type { ClassDeclaration, ClassType, Member, SourceFile } from "../../model/index.ts";
import type { Finding, FindingData, RuleMeta } from "../framework/index.ts";
import { ClassRule } from "../framework/index.ts";

type MessageId = "mutable" | "collection" | "notValue";

interface State {
	readonly messageId: MessageId;
	readonly data: FindingData;
}

export class NoSharedStateRule extends ClassRule<"strategic/no-shared-state", MessageId> {
	public readonly meta: RuleMeta<"strategic/no-shared-state", MessageId> = {
		contexts: "every",
		description: "A static field of the shared kernel that holds state: one without readonly, a collection, or anything but a value.",
		id: "strategic/no-shared-state",
		messages: {
			collection:
				"{class}.{field} holds a collection in a static field: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
			mutable:
				"{class}.{field} is a static field without readonly: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
			notValue:
				"{class}.{field} holds {holds} in a static field, which can keep state every context reaches, a channel the context map does not show. A static field of the shared kernel holds a value: a primitive, a value object, an identifier, a class of domainDependencies, or a readonly collection of them.",
		},
	};

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<MessageId>[] {
		if (!architecture.locationOf(file).isInSharedKernel) {
			return [];
		}
		const findings: Finding<MessageId>[] = [];
		for (const member of codeClass.members) {
			const state = this.stateOf(member, architecture);
			if (state !== undefined) {
				findings.push(this.finding(file, member.line, member.name, state.messageId, { ...state.data, class: codeClass.name, field: member.name }));
			}
		}
		return findings;
	}

	private stateOf(member: Member, architecture: Architecture): State | undefined {
		if (!member.isStatic || member.kind !== "field") {
			return undefined;
		}
		if (!member.isReadonly) {
			return { data: {}, messageId: "mutable" };
		}
		if (member.holdsCollection) {
			return { data: {}, messageId: "collection" };
		}
		if (member.opaqueValue !== undefined) {
			return { data: { holds: member.opaqueValue }, messageId: "notValue" };
		}
		const service = member.valueTypes.find((type) => !this.isValue(type, architecture));
		if (service === undefined) {
			return undefined;
		}
		const article = /^[AEIOU]/.test(service.name) ? "an" : "a";
		return { data: { holds: `${article} ${service.name}` }, messageId: "notValue" };
	}

	private isValue(type: ClassType, architecture: Architecture): boolean {
		if (architecture.is(type, "ValueObject") || architecture.is(type, "Identifier")) {
			return true;
		}
		const packageName = type.lineage[0]?.packageName;
		return packageName !== undefined && architecture.domainDependencies.has(packageName);
	}
}
