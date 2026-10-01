import { ConcurrencyError } from "@alveolus/core";

import type { OrderSnapshot } from "../../src/ordering/domain/aggregates/order.aggregate.ts";
import { Order } from "../../src/ordering/domain/aggregates/order.aggregate.ts";
import type { OrderId } from "../../src/ordering/domain/value-objects/order-id.identifier.ts";
import type { OrderRepository } from "../../src/ordering/index.ts";

export type StoredOrder = { data: OrderSnapshot; version: number };

export class FakeOrderRepository implements OrderRepository {
	private readonly rows = new Map<string, StoredOrder>();

	public findById(id: OrderId): Promise<Order | undefined> {
		const row = this.rows.get(id.value);
		return Promise.resolve(row === undefined ? undefined : Order.fromSnapshot(structuredClone(row.data), row.version));
	}

	public save(order: Order): Promise<void> {
		const stored = this.rows.get(order.id.value)?.version ?? 0;
		if (stored !== order.version) {
			return Promise.reject(new ConcurrencyError(order, stored));
		}
		this.rows.set(order.id.value, { data: structuredClone(order.toSnapshot()), version: stored + 1 });
		return Promise.resolve();
	}

	public stored(orderId: string): StoredOrder | undefined {
		return this.rows.get(orderId);
	}

	public get size(): number {
		return this.rows.size;
	}
}
