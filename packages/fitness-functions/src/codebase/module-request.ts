export class ModuleRequest {
	public constructor(
		public readonly specifier: string,
		public readonly offset: number,
	) {}
}
