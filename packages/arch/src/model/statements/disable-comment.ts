/** A `// alveolus-disable-next-line …` comment, as written: what follows the marker is read by the rules. */
export class DisableComment {
	public constructor(
		public readonly line: number,
		public readonly text: string,
	) {}

	/** The line the comment is about. */
	public get target(): number {
		return this.line + 1;
	}
}
