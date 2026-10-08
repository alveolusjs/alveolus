/** A top-level statement that is no import, export, class, type or constant of plain data. */
export type StatementKind = "function" | "enum" | "namespace" | "mutable variable" | "computed constant" | "class expression" | "statement";

export class TopLevelStatement {
	public constructor(
		public readonly kind: StatementKind,
		/** The declared name, or the kind of syntax for a bare statement. */
		public readonly name: string,
		public readonly line: number,
	) {}
}
