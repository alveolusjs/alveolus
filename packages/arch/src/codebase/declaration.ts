export type DeclarationKind = "function" | "enum";

export class Declaration {
	public constructor(
		public readonly kind: DeclarationKind,
		public readonly name: string,
		public readonly line: number,
	) {}
}
