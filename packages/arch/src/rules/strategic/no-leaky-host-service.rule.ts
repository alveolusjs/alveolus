import type { Architecture } from "../../architecture/index.ts";
import type { ClassDeclaration, ClassType, SourceFile } from "../../model/index.ts";
import type { Finding, FindingData, RuleMeta } from "../framework/index.ts";
import { ClassRule } from "../framework/index.ts";

type MessageId = "exposes" | "behaviour" | "erased";

export class NoLeakyHostServiceRule extends ClassRule<"strategic/no-leaky-host-service", MessageId> {
	public readonly meta: RuleMeta<"strategic/no-leaky-host-service", MessageId> = {
		contexts: "every",
		description: "An open host service that exposes a class of its context, receives a function or returns an erased type, instead of speaking the published language.",
		id: "strategic/no-leaky-host-service",
		messages: {
			behaviour:
				"{member} receives a function: an open host service receives data, never behaviour, or the upstream context ends up running code of another one. To let another context react, publish an integration event.",
			erased: "{member} returns {type}: an open host service returns a type of its published language, so that what leaves the context can be seen.",
			exposes: "{member} exposes {type}, {kind}{owner}: an open host service speaks the published language.",
		},
	};

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<MessageId>[] {
		if (!architecture.implementsMarker(codeClass, "OpenHostService")) {
			return [];
		}
		const findings = new Map<string, Finding<MessageId>>();
		for (const member of codeClass.publicSurface) {
			const symbol = `${codeClass.name}.${member.name}`;
			if (member.receivesFunction) {
				findings.set(`${symbol}:behaviour`, this.finding(file, member.line, symbol, "behaviour", { member: symbol }));
			}
			if (member.erasedType !== undefined) {
				findings.set(`${symbol}:erased`, this.finding(file, member.line, symbol, "erased", { member: symbol, type: member.erasedType }));
			}
			for (const type of [...member.parameterTypes, ...member.valueTypes]) {
				const key = `${symbol}:${type.name}`;
				if (this.leaks(type, architecture) && !findings.has(key)) {
					findings.set(key, this.finding(file, member.line, symbol, "exposes", this.describe(symbol, type, architecture)));
				}
			}
		}
		return [...findings.values()];
	}

	private leaks(type: ClassType, architecture: Architecture): boolean {
		if (type.isInstalled) {
			return false;
		}
		const declaringFile = type.declaredIn === undefined ? undefined : architecture.project.file(type.declaredIn);
		return declaringFile === undefined || !architecture.locationOf(declaringFile).isInSharedKernel;
	}

	private describe(symbol: string, type: ClassType, architecture: Architecture): FindingData {
		const kind = architecture.kindOf(type) ?? "class";
		const article = /^[AEIO]/.test(kind) ? "an" : "a";
		const declaringFile = type.declaredIn === undefined ? undefined : architecture.project.file(type.declaredIn);
		const context = declaringFile === undefined ? undefined : architecture.locationOf(declaringFile).context;
		return { kind: `${article} ${kind}`, member: symbol, owner: context === undefined ? "" : ` of ${context}`, type: type.name };
	}
}
