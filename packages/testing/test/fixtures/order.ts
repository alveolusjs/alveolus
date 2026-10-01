import { AggregateRoot, DomainError, DomainEvent, err, Identifier, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

export class OrderId extends Identifier<string, "OrderId"> {}

export class OrderCreated extends DomainEvent<OrderId, Record<string, never>> {}

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}

export class OrderCancelled extends DomainEvent<OrderId, { reason: string }> {}

export class InvalidTotal extends DomainError<{ total: number }> {}

export class OrderAlreadyCancelled extends DomainError {}

type OrderEvent = OrderCreated | OrderPlaced | OrderCancelled;

const now: Date = new Date("2026-01-01T00:00:00Z");

export type OrderSnapshot = { id: string; cancelled: boolean };

export class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderEvent> {
	private cancelled = false;

	public static create(id: OrderId): Order {
		const order = new Order(id);
		order.record(new OrderCreated({ aggregateId: id, occurredAt: now, payload: {} }));
		return order;
	}

	public toSnapshot(): OrderSnapshot {
		return { cancelled: this.cancelled, id: this.id.value };
	}

	public place(total: number): Result<void, InvalidTotal> {
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		this.record(new OrderPlaced({ aggregateId: this.id, occurredAt: now, payload: { total } }));
		return ok();
	}

	public cancel(reason: string): Result<void, OrderAlreadyCancelled> {
		if (this.cancelled) {
			return err(new OrderAlreadyCancelled());
		}
		this.cancelled = true;
		this.record(new OrderCancelled({ aggregateId: this.id, occurredAt: now, payload: { reason } }));
		return ok();
	}

	public confirm(): Result<void, never> {
		return ok();
	}
}
