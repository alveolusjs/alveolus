import { AggregateRoot } from "../../src/domain/aggregates/index.ts";
import { DomainEvent } from "../../src/domain/domain-events/index.ts";
import { Identifier } from "../../src/domain/value-objects/index.ts";

export class OrderId extends Identifier<string, "OrderId"> {}

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}

export class Order extends AggregateRoot<OrderId, OrderPlaced> {
	public constructor(id: OrderId) {
		super(id);
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}

	public place(eventId: string, occurredAt: Date): void {
		this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt, payload: { total: 42 } }));
	}
}
