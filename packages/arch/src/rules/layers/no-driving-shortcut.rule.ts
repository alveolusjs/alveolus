import type { Architecture } from "../../architecture/index.ts";
import type { CoreKind } from "../../conventions/index.ts";
import type { ClassDeclaration, Dependency, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { ImportRule } from "../framework/index.ts";

/** What a driving adapter reaches through the application, never directly. */
const shortcuts: readonly CoreKind[] = ["CommandRepository", "QueryRepository", "Port", "AggregateRoot", "Entity", "DomainService"];

export class NoDrivingShortcutRule extends ImportRule<"layers/no-driving-shortcut", "shortcut"> {
	public readonly meta: RuleMeta<"layers/no-driving-shortcut", "shortcut"> = {
		description: "A driving adapter importing a port, a repository, an aggregate, an entity or a domain service instead of calling a handler.",
		id: "layers/no-driving-shortcut",
		messages: {
			shortcut: "Imports {name}, {kind}: a driving adapter calls the command and query handlers, never the ports, repositories or aggregates of the domain.",
		},
	};

	protected appliesTo(file: SourceFile, architecture: Architecture): boolean {
		return architecture.locationOf(file).layer === "driving";
	}

	protected findingFor(dependency: Dependency, file: SourceFile, architecture: Architecture): Finding<"shortcut"> | undefined {
		if (dependency.target.kind !== "file") {
			return undefined;
		}
		const target = architecture.project.file(dependency.target.path);
		if (target === undefined) {
			return undefined;
		}
		for (const codeClass of this.importedClasses(dependency, target)) {
			const kind = this.shortcutKindOf(codeClass, architecture);
			if (kind !== undefined) {
				const article = /^[AEIO]/.test(kind) ? "an" : "a";
				return this.finding(file, dependency.line, codeClass.name, "shortcut", { kind: `${article} ${kind}`, name: codeClass.name });
			}
		}
		return undefined;
	}

	/** The classes the dependency brings in: the named ones, or every class of the file for `import *`. */
	private importedClasses(dependency: Dependency, target: SourceFile): ClassDeclaration[] {
		if (dependency.names.includes("*")) {
			return [...target.classes];
		}
		const classes: ClassDeclaration[] = [];
		for (const name of dependency.names) {
			const codeClass = target.classNamed(name);
			if (codeClass !== undefined) {
				classes.push(codeClass);
			}
		}
		return classes;
	}

	private shortcutKindOf(codeClass: ClassDeclaration, architecture: Architecture): CoreKind | undefined {
		return architecture.kindsOf(codeClass).find((kind) => shortcuts.includes(kind));
	}
}
