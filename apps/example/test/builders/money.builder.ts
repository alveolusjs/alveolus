import { Money } from "../../src/shared-kernel/domain/value-objects/money.value-object.ts";
import { CurrencyBuilder } from "./currency.builder.ts";

export class MoneyBuilder {
	private amount = 1250;
	private currency = "EUR";

	public withAmount(amount: number): this {
		this.amount = amount;
		return this;
	}

	public withCurrency(code: string): this {
		this.currency = code;
		return this;
	}

	public build(): Money {
		const money = Money.create(this.amount, new CurrencyBuilder().withCode(this.currency).build());
		if (!money.ok) {
			throw new Error(`MoneyBuilder: invalid amount ${this.amount}`);
		}
		return money.value;
	}
}
