import { AggregateRoot, err, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { OrderAlreadyPlaced } from "../errors/order.error.ts";
import { OrderPlaced } from "../events/order-placed.event.ts";
import { CustomerId, OrderId } from "../value-objects/ids.identifier.ts";

export type OrderSnapshot = { id: string; customerId: string; status: "draft" | "placed" };

export class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderPlaced> {
	public readonly customerId: CustomerId;
	private status: "draft" | "placed" = "draft";

	private constructor(id: OrderId, customerId: CustomerId, version: number) {
		super(id, { version });
		this.customerId = customerId;
	}

	public static create(id: OrderId, customerId: CustomerId): Order {
		return new Order(id, customerId, 0);
	}

	public static fromSnapshot(snapshot: OrderSnapshot, version: number): Order {
		const order = new Order(new OrderId(snapshot.id), new CustomerId(snapshot.customerId), version);
		order.status = snapshot.status;
		return order;
	}

	public get isPlaced(): boolean {
		return this.status === "placed";
	}

	public place(total: number, now: Date): Result<void, OrderAlreadyPlaced> {
		if (this.isPlaced) {
			return err(new OrderAlreadyPlaced());
		}
		this.status = "placed";
		this.record(new OrderPlaced({ aggregateId: this.id, occurredAt: new Date(now), payload: { total } }));
		return ok();
	}

	public toSnapshot(): OrderSnapshot {
		return { customerId: this.customerId.value, id: this.id.value, status: this.status };
	}
}
