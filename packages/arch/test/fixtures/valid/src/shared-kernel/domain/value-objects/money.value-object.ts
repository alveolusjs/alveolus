import { err, ok, ValueObject } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { InvalidAmount } from "../errors/money.error.ts";
import type { Currency } from "./currency.value-object.ts";

export class Money extends ValueObject<{ amount: number; currency: Currency }> {
	private constructor(props: { amount: number; currency: Currency }) {
		super(props);
	}

	public static create(amount: number, currency: Currency): Result<Money, InvalidAmount> {
		if (amount < 0) {
			return err(new InvalidAmount({ amount }));
		}
		return ok(new Money({ amount, currency }));
	}

	public get amount(): number {
		return this.props.amount;
	}

	public get currency(): Currency {
		return this.props.currency;
	}

	public times(quantity: number): Money {
		return new Money({ amount: this.props.amount * quantity, currency: this.props.currency });
	}
}
