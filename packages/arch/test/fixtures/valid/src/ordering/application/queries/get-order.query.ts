import { err, ok } from "@alveolus/core";
import type { QueryHandler, Result } from "@alveolus/core";

import { OrderNotFound } from "../../domain/errors/order.error.ts";
import type { OrderRepository } from "../../domain/repositories/order.repository.ts";
import { OrderId } from "../../domain/value-objects/ids.identifier.ts";

export type GetOrder = { orderId: string };

export class GetOrderHandler implements QueryHandler<GetOrder, { id: string; placed: boolean }, OrderNotFound> {
	public constructor(private readonly orders: OrderRepository) {}

	public async handle({ orderId }: GetOrder): Promise<Result<{ id: string; placed: boolean }, OrderNotFound>> {
		const order = await this.orders.findById(new OrderId(orderId));
		return order === undefined ? err(new OrderNotFound()) : ok({ id: order.id.value, placed: order.isPlaced });
	}
}
