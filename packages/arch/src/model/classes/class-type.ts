import type { NamedType } from "./named-type.ts";

/** A class used as a type: its name, the file that declares it, and its lineage, the class itself first and then each class it extends. */
export class ClassType {
	public constructor(
		public readonly name: string,
		public readonly declaredIn: string | undefined,
		public readonly lineage: readonly NamedType[],
	) {}

	/** Tells two classes of the same name apart. */
	public get key(): string {
		return `${this.declaredIn ?? ""}#${this.name}`;
	}

	/** Whether the class comes from an installed package rather than from the project. */
	public get isInstalled(): boolean {
		const segments = (this.declaredIn ?? "").split(/[\\/]/);
		return segments.includes("node_modules");
	}
}
