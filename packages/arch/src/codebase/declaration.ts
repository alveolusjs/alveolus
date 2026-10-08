/** A top-level declaration that is no building block, type or constant of data. */
export type DeclarationKind = "function" | "enum" | "namespace" | "mutable variable" | "computed constant" | "class expression" | "statement";

export class Declaration {
	public constructor(
		public readonly kind: DeclarationKind,
		public readonly name: string,
		public readonly line: number,
	) {}
}
