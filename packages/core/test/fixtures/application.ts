import { AggregateRoot } from "../../src/domain/aggregates/index.ts";
import { DomainError } from "../../src/domain/domain-errors/index.ts";
import { DomainEvent } from "../../src/domain/domain-events/index.ts";
import { Identifier } from "../../src/domain/entities/index.ts";
import type { Result } from "../../src/utilities/result/index.ts";
import { err, ok } from "../../src/utilities/result/index.ts";

export class OrderId extends Identifier<string, "OrderId"> {}

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}

export class InvalidTotal extends DomainError<{ total: number }> {}

export class OrderNotFound extends DomainError<{ id: string }> {}

export type OrderSnapshot = { id: string; total: number };

export class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderPlaced> {
	private placedTotal = 0;

	public constructor(id: OrderId) {
		super(id);
	}

	public get total(): number {
		return this.placedTotal;
	}

	public toSnapshot(): OrderSnapshot {
		return { id: this.id.value, total: this.placedTotal };
	}

	public place(total: number, occurredAt: Date): Result<void, InvalidTotal> {
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		this.placedTotal = total;
		this.record(new OrderPlaced({ aggregateId: this.id, occurredAt, payload: { total } }));
		return ok();
	}
}
