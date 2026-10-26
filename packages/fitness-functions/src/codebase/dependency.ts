export class Dependency {
	public constructor(
		public readonly specifier: string,
		public readonly target: string | undefined,
		public readonly line: number,
	) {}
}
