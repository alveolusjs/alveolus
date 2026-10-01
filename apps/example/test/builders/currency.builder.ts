import { Currency } from "../../src/shared-kernel/domain/value-objects/currency.value-object.ts";

export class CurrencyBuilder {
	private code = "EUR";

	public withCode(code: string): this {
		this.code = code;
		return this;
	}

	public build(): Currency {
		const currency = Currency.create(this.code);
		if (!currency.ok) {
			throw new Error(`CurrencyBuilder: invalid code ${this.code}`);
		}
		return currency.value;
	}
}
