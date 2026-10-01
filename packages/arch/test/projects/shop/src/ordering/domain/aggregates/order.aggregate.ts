import { AggregateRoot, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { OrderId } from "../value-objects/order-id.identifier.ts";

export type OrderSnapshot = { id: string; placed: boolean };

export class Order extends AggregateRoot<OrderId> {
	private placed = false;

	public static fromSnapshot(snapshot: OrderSnapshot): Order {
		const order = new Order(new OrderId(snapshot.id));
		order.placed = snapshot.placed;
		return order;
	}

	public place(): Result<void, never> {
		this.placed = true;
		return ok();
	}

	public toSnapshot(): OrderSnapshot {
		return { id: this.id.value, placed: this.placed };
	}
}
