export class Method {
	public constructor(
		public readonly name: string,
		public readonly line: number,
		public readonly returnsResult: boolean,
	) {}
}
