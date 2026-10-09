export type DependencyForm = "import" | "re-export" | "inline type" | "dynamic import" | "require" | "reference" | "augmentation" | "global";

type TargetVisibility = "analysed" | "ignored" | "unresolved";

export type DependencyTarget = { readonly kind: "file"; readonly path: string; readonly visibility: TargetVisibility } | { readonly kind: "package"; readonly name: string };

export class Dependency {
	public constructor(
		public readonly line: number,
		public readonly form: DependencyForm,
		public readonly specifier: string,
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
