export type StatementKind = "function" | "enum" | "namespace" | "mutable variable" | "computed constant" | "class expression" | "statement";

export class TopLevelStatement {
	public constructor(
		public readonly kind: StatementKind,
		public readonly name: string,
		public readonly line: number,
	) {}
}
