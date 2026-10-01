import type { CoreKind } from "./core-api.ts";

export class TypeUsage {
	public constructor(
		public readonly member: string,
		public readonly line: number,
		public readonly typeName: string,
		private readonly kinds: readonly CoreKind[],
	) {}

	public is(kind: CoreKind): boolean {
		return this.kinds.includes(kind);
	}
}
