export class DisableComment {
	public constructor(
		public readonly line: number,
		public readonly text: string,
	) {}

	public get target(): number {
		return this.line + 1;
	}
}
