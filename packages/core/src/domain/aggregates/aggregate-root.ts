import type { AnyDomainEvent } from "../domain-events/index.ts";
import type { AnyIdentifier, JsonValue } from "../entities/index.ts";
import { Entity } from "../entities/index.ts";

export interface AggregateRootOptions {
	readonly version?: number;
}

/**
 * {@link Entity} at the root of an aggregate: a cluster of objects kept consistent as a whole,
 * loaded and saved through a single repository.
 *
 * Business methods return a {@link Result}, change the state and call the protected
 * `record(event)` to record the {@link DomainEvent}s they raise. `domainEvents` reads the
 * recorded events without clearing them; `pullDomainEvents()` returns and clears them.
 * Publishing them is the caller's job, typically a repository or a unit of work after saving.
 *
 * `version` is the persisted version the aggregate was loaded at, `0` for a new one. The
 * aggregate never changes it: repositories compare it to detect concurrent writes.
 *
 * `toSnapshot()` exports the state of the whole aggregate as JSON data, for its repository; a
 * static `fromSnapshot(snapshot, version)` rebuilds it without checking rules or recording events.
 *
 * @typeParam Id - {@link Identifier} subclass identifying the aggregate.
 * @typeParam Snapshot - JSON data describing the state of the aggregate.
 * @typeParam Event - Union of the domain events the aggregate can record.
 *
 * @throws {RangeError} When constructed with a negative or non-integer `version`.
 *
 * @example
 * ```ts
 * type OrderSnapshot = { id: string; total: number };
 *
 * class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderPlaced | OrderCancelled> {
 *   private total = 0;
 *
 *   static fromSnapshot(snapshot: OrderSnapshot, version: number): Order {
 *     const order = new Order(new OrderId(snapshot.id), { version });
 *     order.total = snapshot.total;
 *     return order;
 *   }
 *
 *   toSnapshot(): OrderSnapshot {
 *     return { id: this.id.value, total: this.total };
 *   }
 *
 *   place(total: number, now: Date): Result<void, InvalidTotal> {
 *     if (total <= 0) return err(new InvalidTotal({ total }));
 *     this.record(new OrderPlaced({ aggregateId: this.id, occurredAt: now, payload: { total } }));
 *     return ok();
 *   }
 * }
 *
 * order.place(42, now);
 * await orders.save(order);
 * await publisher.publish(order.pullDomainEvents());
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/aggregates | Aggregates}
 */
export abstract class AggregateRoot<
	Id extends AnyIdentifier,
	Snapshot extends JsonValue,
	Event extends AnyDomainEvent = AnyDomainEvent,
> extends Entity<Id, Snapshot> {
	public readonly version: number;

	private pendingDomainEvents: Event[] = [];

	protected constructor(id: Id, options: AggregateRootOptions = {}) {
		super(id);
		const version = options.version ?? 0;
		if (!Number.isSafeInteger(version) || version < 0) {
			throw new RangeError(`Aggregate version must be a non-negative integer, got ${version}`);
		}
		this.version = version;
	}

	public get domainEvents(): readonly Event[] {
		return [...this.pendingDomainEvents];
	}

	public pullDomainEvents(): Event[] {
		const events = this.pendingDomainEvents;
		this.pendingDomainEvents = [];
		return events;
	}

	protected record(event: Event): void {
		this.pendingDomainEvents.push(event);
	}
}

export type AnyAggregateRoot = AggregateRoot<AnyIdentifier, JsonValue>;
