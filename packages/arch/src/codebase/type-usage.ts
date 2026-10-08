import type { CoreKind } from "./core-api.ts";

export class TypeUsage {
	public constructor(
		public readonly member: string,
		public readonly line: number,
		public readonly typeName: string,
		private readonly kinds: readonly CoreKind[],
		/** The file that declares the type, to tell apart two classes with the same name. */
		public readonly declaredIn: string | undefined,
	) {}

	public is(kind: CoreKind): boolean {
		return this.kinds.includes(kind);
	}

	/** The most specific building block the type extends: `QueryRepository` for a query repository, not `Port`. */
	public get kind(): CoreKind | undefined {
		return this.kinds[0];
	}

	/** Whether the type comes from an installed package rather than from the project. */
	public get isFromPackage(): boolean {
		const segments = (this.declaredIn ?? "").split(/[\\/]/);
		return segments.includes("node_modules");
	}
}
