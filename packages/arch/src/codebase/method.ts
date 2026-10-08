/** A method, a property holding a function (`place = () => {}`), or a setter. */
export type MethodKind = "method" | "function property" | "setter";

export class Method {
	public constructor(
		public readonly name: string,
		public readonly line: number,
		public readonly returnsResult: boolean,
		public readonly kind: MethodKind,
	) {}
}
