export class DisableDirective {
	public readonly rule: string | undefined;
	public readonly reason: string | undefined;

	public constructor(text: string) {
		const match = /^([a-z]+\/[a-z-]+)?\s*(?::\s*(.+?))?\s*$/.exec(text);
		this.rule = match?.[1];
		this.reason = match?.[2];
	}

	public get isComplete(): boolean {
		return this.rule !== undefined && this.reason !== undefined;
	}
}
