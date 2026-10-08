/** What a `// alveolus-disable-next-line` comment says: the rule it names, and why. */
export class DisableDirective {
	public readonly rule: string | undefined;
	public readonly reason: string | undefined;

	public constructor(text: string) {
		// The rule id, then a colon and the reason: `layers/no-impure-domain: legacy pool`.
		const match = /^([a-z]+\/[a-z-]+)?\s*(?::\s*(.+?))?\s*$/.exec(text);
		this.rule = match?.[1];
		this.reason = match?.[2];
	}

	/** Names a rule and gives a reason: the only form that disables anything. */
	public get isComplete(): boolean {
		return this.rule !== undefined && this.reason !== undefined;
	}
}
