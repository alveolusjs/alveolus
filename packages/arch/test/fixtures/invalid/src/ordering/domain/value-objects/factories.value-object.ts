import { ok, ValueObject } from "@alveolus/core";
import type { Result } from "@alveolus/core";

export class Rate extends ValueObject<{ value: number }> {
	private constructor(props: { value: number }) {
		super(props);
	}

	public static create(value: number): Result<Rate, never> {
		return ok(new Rate({ value }));
	}

	public static of(value: number): Rate {
		return new Rate({ value });
	}
}
