import { err, ok, type Result, ValueObject } from '@alveolus/core';

import { UnsupportedCurrency } from './money.errors';

export class Currency extends ValueObject<{ readonly code: string }> {
	static readonly #supported: ReadonlySet<string> = new Set(['EUR', 'USD']);

	private constructor(code: string) {
		super({ code });
	}

	static of(code: string): Result<Currency, UnsupportedCurrency> {
		if (!Currency.#supported.has(code)) {
			return err(new UnsupportedCurrency({ code }));
		}

		return ok(new Currency(code));
	}

	get code(): string {
		return this.props.code;
	}
}
