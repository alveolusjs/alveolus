import type { AggregateRootOptions } from "../../src/domain/aggregates/index.ts";
import { AggregateRoot } from "../../src/domain/aggregates/index.ts";
import { DomainEvent } from "../../src/domain/domain-events/index.ts";
import { Identifier } from "../../src/domain/entities/index.ts";

export class OrderId extends Identifier<string, "OrderId"> {}

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}

export class Order extends AggregateRoot<OrderId, { id: string }, OrderPlaced> {
	public constructor(id: OrderId, options?: AggregateRootOptions) {
		super(id, options);
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}

	public place(occurredAt: Date): void {
		this.record(new OrderPlaced({ aggregateId: this.id, occurredAt, payload: { total: 42 } }));
	}
}
