import type { Codebase, CodeFile, Import } from "../codebase/index.ts";
import type { RuleId } from "../config/index.ts";
import { ImportRule } from "./import-rule.ts";

export class BcIsolationRule extends ImportRule {
	public readonly id: RuleId = "bc-isolation";

	protected appliesTo(file: CodeFile): boolean {
		return file.location.isInBoundedContext || file.location.isInSharedKernel;
	}

	protected problemWith(imported: Import, file: CodeFile, codebase: Codebase): string | undefined {
		if (imported.target.kind !== "file") {
			return undefined;
		}
		const from = file.location;
		const to = imported.target.location;

		if (!to.isOtherBoundedContextThan(from)) {
			return undefined;
		}
		if (from.isInSharedKernel) {
			return `The shared kernel imports no bounded context, but imports ${this.describeTarget(imported, codebase)}.`;
		}
		if (from.isCompositionRoot && to.isCompositionRoot) {
			return undefined;
		}
		if (to.layer === "published-language") {
			return `Imports the published language of ${to.context}: redeclare the fields you read in your own published-language/.`;
		}
		if (!this.importsOnlyOpenHostServices(imported, codebase)) {
			return `Imports ${this.describeTarget(imported, codebase)}: only an OpenHostService of another bounded context may be imported.`;
		}
		if (!from.isCompositionRoot && !file.declaresAntiCorruptionLayer) {
			return `Uses the open host service of ${to.context} outside an AntiCorruptionLayer: translate it in an anti-corruption layer.`;
		}
		return undefined;
	}

	private importsOnlyOpenHostServices(imported: Import, codebase: Codebase): boolean {
		if (imported.target.kind !== "file" || imported.names.length === 0) {
			return false;
		}
		const target = codebase.file(imported.target.path);
		return target !== undefined && imported.names.every((name) => target.declaresOpenHostService(name));
	}
}
