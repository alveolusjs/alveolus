import type { Architecture } from "../../architecture/index.ts";
import type { ClassDeclaration, ClassType, SourceFile } from "../../model/index.ts";
import type { Finding, FindingData, RuleMeta } from "../framework/index.ts";
import { ClassRule } from "../framework/index.ts";

export class NoLeakyHostServiceRule extends ClassRule<"strategic/no-leaky-host-service", "exposes"> {
	public readonly meta: RuleMeta<"strategic/no-leaky-host-service", "exposes"> = {
		description: "An open host service that exposes a class of its context instead of the published language.",
		id: "strategic/no-leaky-host-service",
		messages: {
			exposes: "{member} exposes {type}, {kind}{owner}: an open host service speaks the published language.",
		},
	};

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<"exposes">[] {
		if (!architecture.implementsMarker(codeClass, "OpenHostService")) {
			return [];
		}
		const findings = new Map<string, Finding<"exposes">>();
		for (const member of codeClass.publicSurface) {
			const symbol = `${codeClass.name}.${member.name}`;
			for (const type of [...member.parameterTypes, ...member.valueTypes]) {
				const key = `${symbol}:${type.name}`;
				if (this.leaks(type, architecture) && !findings.has(key)) {
					findings.set(key, this.finding(file, member.line, symbol, "exposes", this.describe(symbol, type, architecture)));
				}
			}
		}
		return [...findings.values()];
	}

	/** A class of the project leaks the model; a class of a package or of the shared kernel is shared on purpose. */
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
