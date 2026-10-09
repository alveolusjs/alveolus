import type { Architecture } from "../../architecture/index.ts";
import type { Dependency, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { ImportRule } from "../framework/index.ts";

type MessageId = "reexport" | "sharedKernel" | "publishedLanguage" | "notOpenHostService" | "outsideAntiCorruptionLayer";

export class NoCrossContextImportRule extends ImportRule<"strategic/no-cross-context-import", MessageId> {
	public readonly meta: RuleMeta<"strategic/no-cross-context-import", MessageId> = {
		contexts: "every",
		description: "An import from another bounded context that is not its open host service, a composition root that re-exports.",
		id: "strategic/no-cross-context-import",
		messages: {
			notOpenHostService: "Imports {target}: only an OpenHostService of another bounded context may be imported.",
			outsideAntiCorruptionLayer: "Uses the open host service of {context} outside an AntiCorruptionLayer: a core context translates what it consumes in an anti-corruption layer.",
			publishedLanguage: "Imports the published language of {context}: redeclare the fields you read in your own published-language/.",
			reexport: "The composition root re-exports {names}: it exports its own module only, so that no other context reaches through it.",
			sharedKernel: "The shared kernel imports no bounded context, but imports {target}.",
		},
	};

	protected appliesTo(file: SourceFile, architecture: Architecture): boolean {
		const location = architecture.locationOf(file);
		return location.isInBoundedContext || location.isInSharedKernel;
	}

	protected findingFor(dependency: Dependency, file: SourceFile, architecture: Architecture): Finding<MessageId> | undefined {
		const from = architecture.locationOf(file);
		if (from.isCompositionRoot && dependency.form === "re-export") {
			return this.finding(file, dependency.line, dependency.label, "reexport", { names: dependency.label });
		}
		const target = dependency.target;
		if (target.kind !== "file") {
			return undefined;
		}
		const to = architecture.locationOfTarget(target);
		if (!to.isOtherBoundedContextThan(from)) {
			return undefined;
		}
		if (from.isInSharedKernel) {
			return this.finding(file, dependency.line, dependency.label, "sharedKernel", { target: this.wording.target(target, architecture) });
		}
		if (from.isCompositionRoot && to.isCompositionRoot) {
			return undefined;
		}
		if (to.layer === "published-language") {
			return this.finding(file, dependency.line, dependency.label, "publishedLanguage", { context: to.context ?? "" });
		}
		if (!this.importsOnlyOpenHostServices(dependency, target.path, architecture)) {
			return this.finding(file, dependency.line, dependency.label, "notOpenHostService", { target: this.wording.target(target, architecture) });
		}
		if (from.isInCoreDomain && !from.isCompositionRoot && !this.declaresAntiCorruptionLayer(file, architecture)) {
			return this.finding(file, dependency.line, dependency.label, "outsideAntiCorruptionLayer", { context: to.context ?? "" });
		}
		return undefined;
	}

	private importsOnlyOpenHostServices(dependency: Dependency, path: string, architecture: Architecture): boolean {
		const target = architecture.project.file(path);
		if (target === undefined || dependency.names.length === 0) {
			return false;
		}
		return dependency.names.every((name) => {
			const declaration = target.classNamed(name);
			return declaration !== undefined && architecture.implementsMarker(declaration, "OpenHostService");
		});
	}

	private declaresAntiCorruptionLayer(file: SourceFile, architecture: Architecture): boolean {
		return file.classes.some((codeClass) => architecture.implementsMarker(codeClass, "AntiCorruptionLayer"));
	}
}
