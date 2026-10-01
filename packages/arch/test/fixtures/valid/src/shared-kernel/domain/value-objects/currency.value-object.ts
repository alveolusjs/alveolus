import { err, ok, ValueObject } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { InvalidCurrency } from "../errors/money.error.ts";

export class Currency extends ValueObject<{ code: string }> {
	private constructor(props: { code: string }) {
		super(props);
	}

	public static create(code: string): Result<Currency, InvalidCurrency> {
		if (!/^[A-Z]{3}$/.test(code)) {
			return err(new InvalidCurrency({ code }));
		}
		return ok(new Currency({ code }));
	}

	public get code(): string {
		return this.props.code;
	}
}
