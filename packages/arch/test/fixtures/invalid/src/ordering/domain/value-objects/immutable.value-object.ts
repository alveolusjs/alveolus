import { ok, ValueObject } from "@alveolus/core";
import type { Result } from "@alveolus/core";

export class Price extends ValueObject<{ amount: number }> {
	public label = "price";
	private cache: number;
	private readonly history: number[] = [];

	private constructor(props: { amount: number }) {
		super(props);
		this.cache = props.amount;
	}

	public static create(amount: number): Result<Price, never> {
		return ok(new Price({ amount }));
	}

	public set note(note: string) {
		this.label = note;
	}

	public discount(): number {
		this.cache = 0;
		return this.cache + this.history.length;
	}

	public bump(): number {
		return this.cache++;
	}
}
