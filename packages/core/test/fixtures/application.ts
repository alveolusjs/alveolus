import { CommandHandler } from '../../src/application/command-handlers/index.ts';
import type { DomainEventDispatcher } from '../../src/application/domain-event-dispatchers/index.ts';
import { EventPublisher } from '../../src/application/event-publishers/index.ts';
import { EventTranslator } from '../../src/application/event-translators/index.ts';
import type { AnyIntegrationEvent, IntegrationEvent } from '../../src/application/integration-events/index.ts';
import { QueryHandler } from '../../src/application/query-handlers/index.ts';
import { AggregateRoot } from '../../src/domain/aggregates/index.ts';
import { DomainError } from '../../src/domain/domain-errors/index.ts';
import { DomainEvent } from '../../src/domain/domain-events/index.ts';
import { Clock, IdGenerator } from '../../src/domain/ports/index.ts';
import { CommandRepository, QueryRepository } from '../../src/domain/repositories/index.ts';
import { Identifier } from '../../src/domain/value-objects/index.ts';
import type { View } from '../../src/domain/views/index.ts';
import type { PublishedLanguage } from '../../src/strategic/published-language/index.ts';
import type { Result } from '../../src/utilities/result/index.ts';
import { err, ok } from '../../src/utilities/result/index.ts';

export class OrderId extends Identifier<string, 'OrderId'> {}

export type OrderPlacedSnapshot = { orderId: string; occurredAt: string; total: number };

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {
	public static fromSnapshot(snapshot: OrderPlacedSnapshot): OrderPlaced {
		return new OrderPlaced({
			aggregateId: new OrderId(snapshot.orderId),
			occurredAt: new Date(snapshot.occurredAt),
			payload: { total: snapshot.total },
		});
	}

	public toSnapshot(): OrderPlacedSnapshot {
		return {
			orderId: this.aggregateId.value,
			occurredAt: this.occurredAt.toISOString(),
			total: this.payload.total,
		};
	}
}

export class OrderPaid extends DomainEvent<OrderId, { total: number; reference: string }> {}

export class OrderShipped extends DomainEvent<OrderId, { carrier: string }> {}

export type OrderEvent = OrderPlaced | OrderPaid | OrderShipped;

export class InvalidTotal extends DomainError<{ total: number }> {}

export class OrderNotFound extends DomainError<{ id: string }> {}

export type OrderSnapshot = { id: string; total: number };

export class Order extends AggregateRoot<OrderId, OrderPlaced, OrderSnapshot> {
	#placedTotal = 0;

	public constructor(id: OrderId) {
		super(id);
	}

	public static fromSnapshot(snapshot: OrderSnapshot): Order {
		const order = new Order(new OrderId(snapshot.id));
		order.#placedTotal = snapshot.total;
		return order;
	}

	public toSnapshot(): OrderSnapshot {
		return { id: this.id.value, total: this.#placedTotal };
	}

	public get total(): number {
		return this.#placedTotal;
	}

	public place(total: number, occurredAt: Date): Result<void, InvalidTotal> {
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		this.#placedTotal = total;
		this.record(new OrderPlaced({ aggregateId: this.id, occurredAt, payload: { total } }));
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
	readonly #date: Date;

	public constructor(date: Date) {
		super();
		this.#date = date;
	}

	public now(): Date {
		return this.#date;
	}
}

export class SequentialIdGenerator extends IdGenerator {
	#count = 0;

	public next(): string {
		this.#count += 1;
		return `evt_${this.#count}`;
	}
}

export abstract class Orders extends CommandRepository<Order> {
	public abstract countPlaced(): Promise<number>;
}

export class InMemoryOrders extends Orders {
	readonly #snapshots = new Map<string, OrderSnapshot>();

	public findById(id: OrderId): Promise<Order | undefined> {
		const snapshot = this.#snapshots.get(id.value);
		return Promise.resolve(snapshot === undefined ? undefined : Order.fromSnapshot(snapshot));
	}

	public save(order: Order): Promise<Result<void, never>> {
		this.#snapshots.set(order.id.value, order.toSnapshot());
		return Promise.resolve(ok());
	}

	public countPlaced(): Promise<number> {
		return Promise.resolve([...this.#snapshots.values()].filter((snapshot) => snapshot.total > 0).length);
	}
}

export abstract class OrderSummaries extends QueryRepository<OrderSummary> {
	public abstract summaryOf(id: string): Promise<OrderSummary | undefined>;
}

export class InMemoryOrderSummaries extends OrderSummaries {
	readonly #summaries: readonly OrderSummary[];

	public constructor(summaries: readonly OrderSummary[]) {
		super();
		this.#summaries = summaries;
	}

	public summaryOf(id: string): Promise<OrderSummary | undefined> {
		return Promise.resolve(this.#summaries.find((summary) => summary.id === id));
	}
}

export const ORDER_PLACED = 'ordering.order.OrderPlaced';

export type OrderPlacedRepresentation = PublishedLanguage<
	IntegrationEvent<typeof ORDER_PLACED, { orderId: string; total: number }>
>;

export type OrderPlacedRepresentationV2 = PublishedLanguage<
	IntegrationEvent<typeof ORDER_PLACED, { orderId: string; amount: number }>
>;

export class OrderEventsTranslator extends EventTranslator<OrderEvent> {
	protected readonly source = 'ordering';

	protected translate(event: OrderEvent): AnyIntegrationEvent[] {
		if (event instanceof OrderPlaced) {
			return [this.orderPlacedV1(event)];
		}

		return [];
	}

	protected orderPlacedV1(event: OrderPlaced): OrderPlacedRepresentation {
		return this.wrap(event, {
			payload: { orderId: event.aggregateId.value, total: event.payload.total },
			type: ORDER_PLACED,
			version: 1,
		});
	}
}

export class MigratingOrderEventsTranslator extends OrderEventsTranslator {
	protected override translate(event: OrderEvent): AnyIntegrationEvent[] {
		if (event instanceof OrderPlaced) {
			return [this.orderPlacedV1(event), this.#orderPlacedV2(event)];
		}

		return [];
	}

	#orderPlacedV2(event: OrderPlaced): OrderPlacedRepresentationV2 {
		return this.wrap(event, {
			payload: { amount: event.payload.total, orderId: event.aggregateId.value },
			type: ORDER_PLACED,
			version: 2,
		});
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
	readonly #orders: Orders;
	readonly #events: DomainEventDispatcher<OrderEvent>;
	readonly #clock: Clock;

	public constructor(orders: Orders, events: DomainEventDispatcher<OrderEvent>, clock: Clock) {
		super();
		this.#orders = orders;
		this.#events = events;
		this.#clock = clock;
	}

	public async handle({ orderId, total }: PlaceOrder): Promise<Result<void, OrderNotFound | InvalidTotal>> {
		const order = await this.#orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ id: orderId }));
		}
		const placed = order.place(total, this.#clock.now());
		if (!placed.ok) {
			return placed;
		}
		const saved = await this.#orders.save(order);
		if (!saved.ok) {
			return saved;
		}
		await this.#events.dispatch(order.pullDomainEvents());
		return ok();
	}
}

export class CreateOrderHandler extends CommandHandler<{ orderId: string }, OrderId> {
	public handle({ orderId }: { orderId: string }): Promise<Result<OrderId, never>> {
		return Promise.resolve(ok(new OrderId(orderId)));
	}
}

export class GetOrderSummaryHandler extends QueryHandler<GetOrderSummary, OrderSummary, OrderNotFound> {
	readonly #summaries: OrderSummaries;

	public constructor(summaries: OrderSummaries) {
		super();
		this.#summaries = summaries;
	}

	public async handle({ orderId }: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
		const summary = await this.#summaries.summaryOf(orderId);
		return summary === undefined ? err(new OrderNotFound({ id: orderId })) : ok(summary);
	}
}
