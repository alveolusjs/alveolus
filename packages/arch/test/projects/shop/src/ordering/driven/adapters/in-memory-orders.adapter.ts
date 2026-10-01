import type { OrderSnapshot } from "../../domain/aggregates/order.aggregate.ts";
import { Order } from "../../domain/aggregates/order.aggregate.ts";
import { Orders } from "../../domain/repositories/orders.repository.ts";
import type { OrderId } from "../../domain/value-objects/order-id.identifier.ts";

export class InMemoryOrders extends Orders {
	private readonly snapshots = new Map<string, OrderSnapshot>();

	public findById(id: OrderId): Promise<Order | undefined> {
		const snapshot = this.snapshots.get(id.value);
		return Promise.resolve(snapshot === undefined ? undefined : Order.fromSnapshot(snapshot));
	}

	public save(order: Order): Promise<void> {
		this.snapshots.set(order.id.value, order.toSnapshot());
		return Promise.resolve();
	}
}
