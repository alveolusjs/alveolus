import { err, ok, ValueObject } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { InvalidCurrency } from "../errors/invalid-currency.error.ts";

export type CurrencyCode = keyof typeof Currency.decimalsByCode;

export class Currency extends ValueObject<{ code: CurrencyCode }> {
	public static readonly decimalsByCode = {
		AUD: 2,
		CAD: 2,
		CHF: 2,
		CNY: 2,
		EUR: 2,
		GBP: 2,
		HKD: 2,
		JPY: 0,
		SGD: 2,
		USD: 2,
	};

	private constructor(props: { code: CurrencyCode }) {
		super(props);
	}

	public static create(code: string): Result<Currency, InvalidCurrency> {
		if (!Currency.isSupported(code)) {
			return err(new InvalidCurrency({ currency: code }));
		}
		return ok(new Currency({ code }));
	}

	private static isSupported(code: string): code is CurrencyCode {
		return Object.hasOwn(Currency.decimalsByCode, code);
	}

	public get code(): CurrencyCode {
		return this.props.code;
	}

	public get decimals(): number {
		return Currency.decimalsByCode[this.props.code];
	}
}
