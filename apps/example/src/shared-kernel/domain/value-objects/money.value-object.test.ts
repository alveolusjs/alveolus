import { describe, expect, it } from "vitest";

import { CurrencyBuilder } from "../../../../test/builders/currency.builder.ts";
import { MoneyBuilder } from "../../../../test/builders/money.builder.ts";
import { InvalidAmount } from "../errors/invalid-amount.error.ts";
import { Money } from "./money.value-object.ts";

const euro = new CurrencyBuilder().withCode("EUR").build();

describe("Money", () => {
	it("is created from an amount in minor units and a currency", () => {
		const money = Money.create(1250, euro);

		expect(money.ok && [money.value.amount, money.value.currency.code]).toEqual([1250, "EUR"]);
	});

	it("refuses a negative or fractional amount", () => {
		expect(Money.create(-1, euro)).toEqual({ error: new InvalidAmount({ amount: -1 }), ok: false });
		expect(Money.create(1.5, euro)).toEqual({ error: new InvalidAmount({ amount: 1.5 }), ok: false });
	});

	it("is equal to another amount of the same value and currency", () => {
		const money = new MoneyBuilder().withAmount(100).build();

		expect(money.equals(new MoneyBuilder().withAmount(100).build())).toBe(true);
		expect(money.equals(new MoneyBuilder().withAmount(100).withCurrency("USD").build())).toBe(false);
	});

	it("multiplies by a quantity", () => {
		expect(new MoneyBuilder().withAmount(250).build().times(3).amount).toBe(750);
	});
});
