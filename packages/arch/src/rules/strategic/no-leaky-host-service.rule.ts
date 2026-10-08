import type { Codebase, CodeClass, CodeFile, TypeUsage } from "../../codebase/index.ts";
import type { RuleId } from "../../config/index.ts";
import { ClassRule } from "../class-rule.ts";
import type { Problem } from "../problem.ts";

export class NoLeakyHostServiceRule extends ClassRule {
	public readonly id: RuleId = "strategic/no-leaky-host-service";

	protected problemsWith(codeClass: CodeClass, _file: CodeFile, codebase: Codebase): Problem[] {
		if (!codeClass.implements("OpenHostService")) {
			return [];
		}
		const problems = new Map<string, Problem>();
		for (const usage of codeClass.publicSurface) {
			const symbol = `${codeClass.name}.${usage.member}`;
			if (this.leaks(usage, codebase) && !problems.has(`${symbol}:${usage.typeName}`)) {
				problems.set(`${symbol}:${usage.typeName}`, { line: usage.line, message: this.messageFor(symbol, usage, codebase), symbol });
			}
		}
		return [...problems.values()];
	}

	/** A class of the project leaks the model; a class of a package or of the shared kernel is shared on purpose. */
	private leaks(usage: TypeUsage, codebase: Codebase): boolean {
		if (usage.isFromPackage) {
			return false;
		}
		const declaringFile = usage.declaredIn === undefined ? undefined : codebase.file(usage.declaredIn);
		return declaringFile === undefined || !declaringFile.location.isInSharedKernel;
	}

	private messageFor(symbol: string, usage: TypeUsage, codebase: Codebase): string {
		const kind = usage.kind ?? "class";
		const context = usage.declaredIn === undefined ? undefined : codebase.file(usage.declaredIn)?.location.context;
		const owner = context === undefined ? "" : ` of ${context}`;
		const article = /^[AEIO]/.test(kind) ? "an" : "a";
		return `${symbol} exposes ${usage.typeName}, ${article} ${kind}${owner}: an open host service speaks the published language.`;
	}
}
