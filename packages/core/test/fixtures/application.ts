import { CommandHandler } from "../../src/application/command-handlers/index.ts";
import { EventPublisher } from "../../src/application/event-publishers/index.ts";
import { EventTranslator } from "../../src/application/event-translators/index.ts";
import type { AnyIntegrationEvent, IntegrationEvent, IntegrationEventContext } from "../../src/application/integration-events/index.ts";
import type { Outbox } from "../../src/application/outbox/index.ts";
import { QueryHandler } from "../../src/application/query-handlers/index.ts";
import { AggregateRoot } from "../../src/domain/aggregates/index.ts";
import { DomainError } from "../../src/domain/domain-errors/index.ts";
import { DomainEvent } from "../../src/domain/domain-events/index.ts";
import { Clock, IdGenerator } from "../../src/domain/ports/index.ts";
import { CommandRepository, QueryRepository } from "../../src/domain/repositories/index.ts";
import { Identifier } from "../../src/domain/value-objects/index.ts";
import type { View } from "../../src/domain/views/index.ts";
import type { PublishedLanguage } from "../../src/strategic/published-language/index.ts";
import type { Result } from "../../src/utilities/result/index.ts";
import { err, ok } from "../../src/utilities/result/index.ts";

export class OrderId extends Identifier<string, "OrderId"> {}

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}

export class InvalidTotal extends DomainError<{ total: number }> {}

export class OrderNotFound extends DomainError<{ id: string }> {}

export type OrderSnapshot = { id: string; total: number };

export class Order extends AggregateRoot<OrderId, OrderPlaced, OrderSnapshot> {
	private placedTotal = 0;

	public constructor(id: OrderId) {
		super(id);
	}

	public static fromSnapshot(snapshot: OrderSnapshot): Order {
		const order = new Order(new OrderId(snapshot.id));
		order.placedTotal = snapshot.total;
		return order;
	}

	public toSnapshot(): OrderSnapshot {
		return { id: this.id.value, total: this.placedTotal };
	}

	public get total(): number {
		return this.placedTotal;
	}

	public place(total: number, eventId: string, occurredAt: Date): Result<void, InvalidTotal> {
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		this.placedTotal = total;
		this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt, payload: { total } }));
		return ok();
	}
}

export type OrderSummary = View<{ id: string; total: number }>;

export interface PlaceOrder {
	readonly orderId: string;
	readonly total: number;
}

export interface GetOrderSummary {
	readonly orderId: string;
}

export class FixedClock extends Clock {
	public constructor(private readonly date: Date) {
		super();
	}

	public now(): Date {
		return this.date;
	}
}

export class SequentialIdGenerator extends IdGenerator {
	private count = 0;

	public next(): string {
		this.count += 1;
		return `evt_${this.count}`;
	}
}

export abstract class Orders extends CommandRepository<Order> {
	public abstract countPlaced(): Promise<number>;
}

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

	public countPlaced(): Promise<number> {
		return Promise.resolve([...this.snapshots.values()].filter((snapshot) => snapshot.total > 0).length);
	}
}

export abstract class OrderSummaries extends QueryRepository<OrderSummary> {
	public abstract summaryOf(id: string): Promise<OrderSummary | undefined>;
}

export class InMemoryOrderSummaries extends OrderSummaries {
	public constructor(private readonly summaries: readonly OrderSummary[]) {
		super();
	}

	public summaryOf(id: string): Promise<OrderSummary | undefined> {
		return Promise.resolve(this.summaries.find((summary) => summary.id === id));
	}
}

export type OrderPlacedRepresentation = PublishedLanguage<IntegrationEvent<"OrderPlaced", { orderId: string; total: number }>>;

export class OrderEventsTranslator extends EventTranslator<OrderPlaced, OrderPlacedRepresentation> {
	protected readonly source = "ordering";

	public translate(event: OrderPlaced, context: IntegrationEventContext): OrderPlacedRepresentation {
		return this.wrap(event, context, { payload: { orderId: event.aggregateId.value, total: event.payload.total }, type: "OrderPlaced", version: 1 });
	}
}

export class RecordingEventPublisher extends EventPublisher {
	public readonly published: AnyIntegrationEvent[] = [];

	public publish(events: readonly AnyIntegrationEvent[]): Promise<void> {
		this.published.push(...events);
		return Promise.resolve();
	}
}

export class PlaceOrderHandler extends CommandHandler<PlaceOrder, void, OrderNotFound | InvalidTotal> {
	public constructor(
		private readonly orders: Orders,
		private readonly outbox: Outbox,
		private readonly translator: OrderEventsTranslator,
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {
		super();
	}

	public async handle({ orderId, total }: PlaceOrder): Promise<Result<void, OrderNotFound | InvalidTotal>> {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ id: orderId }));
		}
		const placed = order.place(total, this.ids.next(), this.clock.now());
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order);
		await this.outbox.add(order.pullDomainEvents().map((event) => this.translator.translate(event, { correlationId: orderId })));
		return ok();
	}
}

export class CreateOrderHandler extends CommandHandler<{ orderId: string }, OrderId> {
	public handle({ orderId }: { orderId: string }): Promise<Result<OrderId, never>> {
		return Promise.resolve(ok(new OrderId(orderId)));
	}
}

export class GetOrderSummaryHandler extends QueryHandler<GetOrderSummary, OrderSummary, OrderNotFound> {
	public constructor(private readonly summaries: OrderSummaries) {
		super();
	}

	public async handle({ orderId }: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
		const summary = await this.summaries.summaryOf(orderId);
		return summary === undefined ? err(new OrderNotFound({ id: orderId })) : ok(summary);
	}
}
