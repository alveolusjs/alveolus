import { AggregateRoot } from '../../src/domain/aggregates/index.ts';
import { DomainEvent } from '../../src/domain/domain-events/index.ts';
import { Identifier } from '../../src/domain/value-objects/index.ts';

export class OrderId extends Identifier<string, 'OrderId'> {}

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}

export class OrderShipped extends DomainEvent<OrderId, { carrier: string }> {}

export type OrderSnapshot = { id: string; placedAt: Date | null; lines: readonly { sku: string; quantity: number }[] };

export class Order extends AggregateRoot<OrderId, OrderPlaced, OrderSnapshot> {
	#placedAt: Date | null = null;

	public constructor(id: OrderId) {
		super(id);
	}

	public toSnapshot(): OrderSnapshot {
		return { id: this.id.value, lines: [{ quantity: 2, sku: 'p1' }], placedAt: this.#placedAt };
	}

	public place(occurredAt: Date): void {
		this.#placedAt = occurredAt;
		this.record(new OrderPlaced({ aggregateId: this.id, occurredAt, payload: { total: 42 } }));
	}

	public ship(occurredAt: Date): void {
		// @ts-expect-error
		this.record(new OrderShipped({ aggregateId: this.id, occurredAt, payload: { carrier: 'c1' } }));
	}
}

export class Catalog extends AggregateRoot<OrderId, never, { id: string }> {
	public constructor(id: OrderId) {
		super(id);
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
