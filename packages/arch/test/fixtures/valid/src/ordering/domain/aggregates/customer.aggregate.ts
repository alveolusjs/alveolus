import { AggregateRoot, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import type { OrderId } from "../value-objects/ids.identifier.ts";
import { CustomerId } from "../value-objects/ids.identifier.ts";
import { Order } from "./order.aggregate.ts";

export type CustomerSnapshot = { id: string };

export class Customer extends AggregateRoot<CustomerId, CustomerSnapshot> {
	public static create(id: CustomerId): Customer {
		return new Customer(id);
	}

	public static fromSnapshot(snapshot: CustomerSnapshot, version: number): Customer {
		return new Customer(new CustomerId(snapshot.id), { version });
	}

	public placeOrder(orderId: OrderId): Result<Order, never> {
		return ok(Order.create(orderId, this.id));
	}

	public toSnapshot(): CustomerSnapshot {
		return { id: this.id.value };
	}
}
