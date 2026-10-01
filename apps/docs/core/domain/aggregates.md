# Aggregates

An aggregate is a cluster of objects kept consistent as one unit. Code outside the aggregate goes
through its root, which enforces the business rules, records what happened as domain events and
returns failures as values.

```ts
export class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderPlaced> {
	place(total: number, now: Date): Result<void, InvalidTotal> {
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		this.record(
			new OrderPlaced({
				aggregateId: this.id,
				occurredAt: now,
				payload: { total },
			}),
		);
		return ok();
	}
}
```

<div class="al-diagram">
<svg viewBox="0 0 640 220" role="img" aria-label="The Order aggregate contains its root, order lines and money values. It references the Customer aggregate only through a CustomerId.">
	<rect class="boundary" x="10" y="10" width="380" height="200" rx="12" />
	<text class="note" x="26" y="34">Order aggregate</text>
	<rect class="box" x="30" y="50" width="160" height="56" rx="8" />
	<text class="label" x="44" y="76">Order</text>
	<text class="note" x="44" y="94">AggregateRoot</text>
	<rect class="box" x="210" y="50" width="160" height="56" rx="8" />
	<text class="label" x="224" y="76">OrderLine</text>
	<text class="note" x="224" y="94">Entity</text>
	<rect class="box" x="30" y="130" width="160" height="56" rx="8" />
	<text class="label" x="44" y="156">Money</text>
	<text class="note" x="44" y="174">ValueObject</text>
	<rect class="box" x="210" y="130" width="160" height="56" rx="8" />
	<text class="label" x="224" y="156">CustomerId</text>
	<text class="note" x="224" y="174">Identifier</text>
	<rect class="box" x="470" y="130" width="150" height="56" rx="8" />
	<text class="label" x="484" y="156">Customer</text>
	<text class="note" x="484" y="174">other aggregate</text>
	<path class="link" d="M370 158 H460" />
	<path class="arrow" d="M470 158 l-10 -5 v10 z" />
	<text class="note" x="404" y="118">by identity only</text>
</svg>
</div>

## When to use

Make an aggregate of each group of objects that must change together to stay consistent, such as an
order and its lines. Keep aggregates small: when two things can be updated separately, make them
two aggregates that reference each other by identifier.

## Usage

### Create an aggregate

Extend `AggregateRoot` with the identifier type, the type of its snapshot and the union of the
events the aggregate records. Keep the constructor private and expose static factories.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot } from "@alveolus/core";
import type { OrderPlaced } from "../events/order-placed.event.ts";
import { OrderId } from "../value-objects/order-id.identifier.ts";

export type OrderSnapshot = { id: string; placed: boolean };

export class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderPlaced> {
	private placed = false;

	private constructor(id: OrderId, version = 0) {
		super(id, { version });
	}

	static create(id: OrderId): Order {
		return new Order(id);
	}

	static fromSnapshot(snapshot: OrderSnapshot, version: number): Order {
		const order = new Order(new OrderId(snapshot.id), version);
		order.placed = snapshot.placed;
		return order;
	}

	toSnapshot(): OrderSnapshot {
		return { id: this.id.value, placed: this.placed };
	}
}
```

### Validate input in a factory

A static factory is the only way to create the aggregate, so it is where creation rules go. When
the input can be refused, return a `Result` instead of the aggregate.

```ts
static create(id: OrderId, lines: readonly OrderLine[]): Result<Order, EmptyOrder> {
	if (lines.length === 0) {
		return err(new EmptyOrder());
	}
	return ok(new Order(id, lines));
}
```

### Create another aggregate

An aggregate can act as the factory of another one when it holds the data to create it. The method
returns the new aggregate, which keeps only the identifier of its creator.

```ts
class Customer extends AggregateRoot<CustomerId, CustomerSnapshot> {
	placeOrder(orderId: OrderId): Result<Order, CustomerBlocked> {
		if (this.blocked) {
			return err(new CustomerBlocked());
		}
		return ok(Order.create(orderId, this.id));
	}
}
```

### Change state and record events

Business methods change the state, then call `record` with the event that describes the change.
The aggregate receives the current date as a parameter.

```ts
place(total: number, now: Date): Result<void, OrderAlreadyPlaced | InvalidTotal> {
	this.placed = true;
	this.record(
		new OrderPlaced({ aggregateId: this.id, occurredAt: now, payload: { total } }),
	);
	return ok();
}
```

### Return business errors

Check the business rules first and return a [`DomainError`](./domain-errors.md) in an `err` when one
fails. Nothing changes and nothing is recorded.

```ts
place(total: number, now: Date): Result<void, OrderAlreadyPlaced | InvalidTotal> {
	if (this.placed) {
		return err(new OrderAlreadyPlaced());
	}
	if (total <= 0) {
		return err(new InvalidTotal({ total }));
	}
	this.placed = true;
	this.record(
		new OrderPlaced({ aggregateId: this.id, occurredAt: now, payload: { total } }),
	);
	return ok();
}
```

### Publish recorded events

Alveolus does not publish events. After saving the aggregate, pull its events and hand them to
your publisher. `pullDomainEvents` returns them in the order they were recorded and clears them.

```ts
await orders.save(order);
await publisher.publish(order.pullDomainEvents());
```

### Export and restore a snapshot

Every aggregate exports its state with `toSnapshot()`, for its [repository](./repositories.md).
The snapshot is plain JSON data declared with a `type` alias: identifiers become their value, value
objects their primitive values, dates ISO strings, and each entity provides its own snapshot.

```ts
export type OrderSnapshot = {
	id: string;
	status: OrderStatus;
	placedAt: string | null;
	lines: OrderLineSnapshot[];
};

toSnapshot(): OrderSnapshot {
	return {
		id: this.id.value,
		status: this.status,
		placedAt: this.placedAt?.toISOString() ?? null,
		lines: this.lines.map((line) => line.toSnapshot()),
	};
}
```

A static `fromSnapshot` rebuilds the aggregate from a snapshot and the persisted `version`. It does
not go through business methods: it checks no rule and records no event. The aggregate never
changes `version`; the repository uses it to detect concurrent writes.

```ts
static fromSnapshot(snapshot: OrderSnapshot, version: number): Order {
	return new Order(
		new OrderId(snapshot.id),
		snapshot.status,
		snapshot.placedAt === null ? null : new Date(snapshot.placedAt),
		snapshot.lines.map(OrderLine.fromSnapshot),
		version,
	);
}
```

## Reference

```ts
abstract class AggregateRoot<
	Id extends AnyIdentifier,
	Snapshot extends JsonValue,
	Event extends AnyDomainEvent = AnyDomainEvent,
> extends Entity<Id, Snapshot>
```

| Type parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `Id`           | The [`Identifier`](./entities.md) of the aggregate.  |
| `Snapshot`     | The JSON data describing its state.                  |
| `Event`        | Union of the domain events the aggregate records.    |

| Member                                   | Type                          | Description                                                    |
| ---------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| `constructor(id, options?)`              | protected                     | `options.version` is the persisted version, `0` by default.    |
| `id`                                     | `Id`                          | Inherited from [`Entity`](./entities.md).                      |
| `version`                                | `number`                      | Version the aggregate was loaded at.                           |
| `domainEvents`                           | `readonly Event[]`            | Recorded events, in order. Reading them does not clear them.   |
| `pullDomainEvents()`                     | `Event[]`                     | Returns the recorded events, in order, and clears them.        |
| `record(event)`                          | protected, `void`             | Records an event.                                              |
| `equals(other)`                          | `boolean`                     | Same class and equal identifiers.                              |
| `toSnapshot()`                           | abstract, `Snapshot`          | The state of the aggregate as JSON data.                       |

**Caveats**

- A negative or non-integer `version` throws a `RangeError`.
- TypeScript has no abstract static method: `fromSnapshot` is checked by the
  [`aggregate/from-snapshot`](/arch/rules/aggregates) rule.
- Declare a snapshot with a `type` alias or inline. TypeScript does not consider an `interface` as
  JSON, even when all its properties are; a `Date`, an identifier or a value object in a snapshot
  does not compile either.
- `domainEvents` returns a copy: changing it does not change the aggregate.

Import from `@alveolus/core` or `@alveolus/core/aggregates`.

## See also

- [Entities](./entities.md) and [Value Objects](./value-objects.md) inside an aggregate
- [Domain Events](./domain-events.md) recorded by an aggregate
- [Domain Errors](./domain-errors.md) returned by its methods
- [Repositories](./repositories.md), to load and save it
- [Aggregate rules](/arch/rules/aggregates), checked by `alveolus arch check`
- [Scenarios](/testing/scenarios), to test it
