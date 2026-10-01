import { describe, expect, it } from "vitest";

import { InvalidCurrency } from "../errors/invalid-currency.error.ts";
import { Currency } from "./currency.value-object.ts";

describe("Currency", () => {
	it("is created from a supported ISO 4217 code", () => {
		const currency = Currency.create("EUR");

		expect(currency.ok && currency.value.code).toBe("EUR");
	});

	it("accepts the ten most traded currencies", () => {
		const codes = Object.keys(Currency.decimalsByCode);

		expect(codes.toSorted()).toEqual(["AUD", "CAD", "CHF", "CNY", "EUR", "GBP", "HKD", "JPY", "SGD", "USD"]);
		expect(codes.map((code) => Currency.create(code).ok)).toEqual(codes.map(() => true));
	});

	it("knows its number of decimals", () => {
		const [euro, yen] = [Currency.create("EUR"), Currency.create("JPY")];

		expect(euro.ok && euro.value.decimals).toBe(2);
		expect(yen.ok && yen.value.decimals).toBe(0);
	});

	it("refuses any other code, including inherited object keys", () => {
		expect(Currency.create("toString")).toEqual({
			error: new InvalidCurrency({ currency: "toString" }),
			ok: false,
		});
		expect(Currency.create("euro")).toEqual({ error: new InvalidCurrency({ currency: "euro" }), ok: false });
		expect(Currency.create("SEK")).toEqual({ error: new InvalidCurrency({ currency: "SEK" }), ok: false });
	});

	it("is equal to the same code", () => {
		const [a, b, c] = [Currency.create("EUR"), Currency.create("EUR"), Currency.create("USD")];

		expect(a.ok && b.ok && a.value.equals(b.value)).toBe(true);
		expect(a.ok && c.ok && a.value.equals(c.value)).toBe(false);
	});
});
