/** How a file depends on another module. */
export type DependencyForm = "import" | "re-export" | "inline type" | "dynamic import" | "require" | "global";

/** Whether the analysis reads the file a dependency points to. */
type TargetVisibility = "analysed" | "ignored" | "unresolved";

export type DependencyTarget = { readonly kind: "file"; readonly path: string; readonly visibility: TargetVisibility } | { readonly kind: "package"; readonly name: string };

/**
 * One way a file depends on another module: `import … from`, `export … from`, `import("…").T`, `import()`, `require()`,
 * or a global the project declares in another file.
 */
export class Dependency {
	public constructor(
		public readonly line: number,
		public readonly form: DependencyForm,
		/** As written; a specifier computed at runtime keeps its source text. */
		public readonly specifier: string,
		/** The imported names, `*` for a whole module, `default` for a default import. */
		public readonly names: readonly string[],
		public readonly target: DependencyTarget,
	) {}

	public get label(): string {
		return this.names.length === 0 ? this.specifier : this.names.join(", ");
	}

	public isOnPackage(name: string): boolean {
		return this.target.kind === "package" && this.target.name === name;
	}
}
