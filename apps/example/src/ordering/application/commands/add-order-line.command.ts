import { andThen, err } from "@alveolus/core";
import type { CommandHandler, Result } from "@alveolus/core";

import type { InvalidAmount } from "../../../shared-kernel/domain/errors/invalid-amount.error.ts";
import type { InvalidCurrency } from "../../../shared-kernel/domain/errors/invalid-currency.error.ts";
import { Currency } from "../../../shared-kernel/domain/value-objects/currency.value-object.ts";
import { Money } from "../../../shared-kernel/domain/value-objects/money.value-object.ts";
import type { CurrencyMismatch } from "../../domain/errors/currency-mismatch.error.ts";
import type { InvalidQuantity } from "../../domain/errors/invalid-quantity.error.ts";
import type { OrderNotDraft } from "../../domain/errors/order-not-draft.error.ts";
import { OrderNotFound } from "../../domain/errors/order-not-found.error.ts";
import type { OrderRepository } from "../../domain/repositories/order.repository.ts";
import { OrderId } from "../../domain/value-objects/order-id.identifier.ts";
import { OrderLineId } from "../../domain/value-objects/order-line-id.identifier.ts";
import { ProductId } from "../../domain/value-objects/product-id.identifier.ts";

export type AddOrderLine = {
	orderId: string;
	lineId: string;
	productId: string;
	unitPrice: { amount: number; currency: string };
	quantity: number;
};

type AddOrderLineError =
	| OrderNotFound
	| InvalidAmount
	| InvalidCurrency
	| OrderNotDraft
	| CurrencyMismatch
	| InvalidQuantity;

export class AddOrderLineHandler implements CommandHandler<AddOrderLine, void, AddOrderLineError> {
	public constructor(private readonly orders: OrderRepository) {}

	public async handle(command: AddOrderLine): Promise<Result<void, AddOrderLineError>> {
		const order = await this.orders.findById(new OrderId(command.orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ orderId: command.orderId }));
		}
		const unitPrice = andThen(Currency.create(command.unitPrice.currency), (currency) =>
			Money.create(command.unitPrice.amount, currency),
		);
		const added = andThen(unitPrice, (price) =>
			order.addLine(new OrderLineId(command.lineId), new ProductId(command.productId), price, command.quantity),
		);
		if (added.ok) {
			await this.orders.save(order);
		}
		return added;
	}
}
