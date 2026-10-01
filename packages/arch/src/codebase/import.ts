import type { Location } from "./location.ts";

export type ImportTarget = { readonly kind: "file"; readonly path: string; readonly location: Location } | { readonly kind: "package"; readonly name: string };

export class Import {
	public constructor(
		public readonly line: number,
		public readonly specifier: string,
		public readonly names: readonly string[],
		public readonly target: ImportTarget,
	) {}

	public get label(): string {
		return this.names.length === 0 ? this.specifier : this.names.join(", ");
	}

	public isFromPackage(name: string): boolean {
		return this.target.kind === "package" && this.target.name === name;
	}
}
