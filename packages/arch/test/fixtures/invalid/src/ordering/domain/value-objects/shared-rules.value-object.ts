import { ValueObject } from "@alveolus/core";

export class Stamp extends ValueObject<{ at: number }> {
	public constructor() {
		super({ at: Date.now() });
	}

	public async fetch(): Promise<number> {
		return Promise.resolve(this.props.at);
	}
}
