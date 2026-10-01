import type { Order } from "../domain/aggregates/order.aggregate.ts";
import type { OrderRepository } from "../domain/repositories/order.repository.ts";
import type { OrderId } from "../domain/value-objects/ids.identifier.ts";

export class InMemoryOrderRepository implements OrderRepository {
	private readonly orders = new Map<string, Order>();

	public async findById(id: OrderId): Promise<Order | undefined> {
		return this.orders.get(id.value);
	}

	public async save(order: Order): Promise<void> {
		this.orders.set(order.id.value, order);
	}
}
