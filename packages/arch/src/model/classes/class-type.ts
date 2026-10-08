import type { NamedType } from "./named-type.ts";

export class ClassType {
	public constructor(
		public readonly name: string,
		public readonly declaredIn: string | undefined,
		public readonly lineage: readonly NamedType[],
	) {}

	public get key(): string {
		return `${this.declaredIn ?? ""}#${this.name}`;
	}

	public get isInstalled(): boolean {
		const segments = (this.declaredIn ?? "").split(/[\\/]/);
		return segments.includes("node_modules");
	}
}
