import { err, ok, type Result, ValueObject } from '@alveolus/core';

import type { Currency } from './currency.value-object';
import { InvalidMoney } from './money.errors';

export class Money extends ValueObject<{ readonly minor: bigint; readonly currency: Currency }> {
	private constructor(minor: bigint, currency: Currency) {
		super({ minor, currency });
	}

	static of(minor: bigint, currency: Currency): Result<Money, InvalidMoney> {
		if (minor < 0n) {
			return err(new InvalidMoney({ minor }));
		}

		return ok(new Money(minor, currency));
	}

	static zero(currency: Currency): Money {
		return new Money(0n, currency);
	}

	get minor(): bigint {
		return this.props.minor;
	}

	get currency(): Currency {
		return this.props.currency;
	}

	isZero(): boolean {
		return this.props.minor === 0n;
	}

	isIn(currency: Currency): boolean {
		return this.props.currency.equals(currency);
	}

	isLessThan(other: Money): boolean {
		this.#assertSameCurrency(other);

		return this.props.minor < other.minor;
	}

	minus(other: Money): Money {
		if (this.isLessThan(other)) {
			throw new Error(`Cannot subtract ${other.minor} from ${this.props.minor}`);
		}

		return new Money(this.props.minor - other.minor, this.props.currency);
	}

	#assertSameCurrency(other: Money): void {
		if (!other.isIn(this.props.currency)) {
			throw new Error(`Cannot combine ${this.props.currency.code} and ${other.currency.code}`);
		}
	}
}
