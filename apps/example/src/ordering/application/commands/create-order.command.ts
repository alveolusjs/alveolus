import { map, ok } from "@alveolus/core";
import type { CommandHandler, Result } from "@alveolus/core";

import type { InvalidCurrency } from "../../../shared-kernel/domain/errors/invalid-currency.error.ts";
import { Currency } from "../../../shared-kernel/domain/value-objects/currency.value-object.ts";
import { Order } from "../../domain/aggregates/order.aggregate.ts";
import type { OrderRepository } from "../../domain/repositories/order.repository.ts";
import { CustomerId } from "../../domain/value-objects/customer-id.identifier.ts";
import { OrderId } from "../../domain/value-objects/order-id.identifier.ts";

export type CreateOrder = {
	orderId: string;
	customerId: string;
	currency: string;
};

export class CreateOrderHandler implements CommandHandler<CreateOrder, void, InvalidCurrency> {
	public constructor(private readonly orders: OrderRepository) {}

	public async handle({ orderId, customerId, currency }: CreateOrder): Promise<Result<void, InvalidCurrency>> {
		const order = map(Currency.create(currency), (valid) =>
			Order.create(new OrderId(orderId), new CustomerId(customerId), valid),
		);
		if (!order.ok) {
			return order;
		}
		await this.orders.save(order.value);
		return ok();
	}
}
