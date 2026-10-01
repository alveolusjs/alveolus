# Aggregates

An aggregate is a cluster of objects kept consistent as one unit. Code outside goes through its
root, which enforces the business rules, records what happened as domain events and returns
failures as values. It is loaded, changed and saved as a whole.

```ts
export class Order extends AggregateRoot<OrderId, OrderPlaced, OrderSnapshot> {
	place(total: number, eventId: string, now: Date): Result<void, OrderAlreadyPlaced> {
		if (this.placedTotal !== null) {
			return err(new OrderAlreadyPlaced());
		}
		this.placedTotal = total;
		this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt: now, payload: { total } }));
		return ok();
	}
}
```

<div class="al-diagram">
<svg viewBox="0 0 680 240" role="img" aria-label="The Order aggregate: the root Order holds order lines and money values. It refers to the Customer aggregate only through a CustomerId.">
	<defs>
		<marker id="aggregate-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="8" width="392" height="224" rx="14" />
	<text class="note" x="24" y="32">Order aggregate · one transaction</text>
	<rect class="box" x="124" y="48" width="160" height="56" rx="8" />
	<text class="label" x="204" y="72" text-anchor="middle">Order</text>
	<text class="note" x="204" y="92" text-anchor="middle">AggregateRoot</text>
	<rect class="box" x="30" y="150" width="160" height="56" rx="8" />
	<text class="label" x="110" y="174" text-anchor="middle">OrderLine</text>
	<text class="note" x="110" y="194" text-anchor="middle">Entity</text>
	<rect class="box" x="218" y="150" width="160" height="56" rx="8" />
	<text class="label" x="298" y="174" text-anchor="middle">Money</text>
	<text class="note" x="298" y="194" text-anchor="middle">ValueObject</text>
	<path class="link" d="M 176 104 L 122 148" marker-end="url(#aggregate-arrow)" />
	<path class="link" d="M 232 104 L 286 148" marker-end="url(#aggregate-arrow)" />
	<rect class="box" x="506" y="48" width="160" height="56" rx="8" />
	<text class="label" x="586" y="72" text-anchor="middle">Customer</text>
	<text class="note" x="586" y="92" text-anchor="middle">another aggregate</text>
	<path class="link" d="M 284 76 L 504 76" stroke-dasharray="4 4" marker-end="url(#aggregate-arrow)" />
	<text class="note" x="453" y="66" text-anchor="middle">CustomerId</text>
</svg>
</div>

## When to use

Make an aggregate of whatever must stay consistent within one transaction: an order and its lines,
whose total must match. Keep it small, and refer to other aggregates by their identifier. A thing
with an identity but no rules of its own, inside another object, is an
[entity](./entities.md); a thing described only by its values is a
[value object](./value-objects.md).

## Usage

### Declare an aggregate

Extend `AggregateRoot` with the identifier type, the union of the events it records and the type of
its snapshot. Keep the constructor private and create through static factories.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot, err, ok, type Result } from "@alveolus/core";

import { OrderAlreadyPlaced } from "../errors/order-already-placed.error";
import { OrderPlaced } from "../events/order-placed.event";
import { OrderId } from "../value-objects/order-id.identifier";

export type OrderSnapshot = { id: string; total: number | null };

export class Order extends AggregateRoot<OrderId, OrderPlaced, OrderSnapshot> {
	private placedTotal: number | null = null;

	private constructor(id: OrderId) {
		super(id);
	}

	static create(id: OrderId): Order {
		return new Order(id);
	}

	get isPlaced(): boolean {
		return this.placedTotal !== null;
	}

	place(total: number, eventId: string, now: Date): Result<void, OrderAlreadyPlaced> {
		if (this.placedTotal !== null) {
			return err(new OrderAlreadyPlaced());
		}
		this.placedTotal = total;
		this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt: now, payload: { total } }));
		return ok();
	}

	toSnapshot(): OrderSnapshot {
		return { id: this.id.value, total: this.placedTotal };
	}
}
```

### Change state through business methods

Every public method that changes the state checks the rules first, then changes the state, then
records an event. It returns a [`Result`](../utilities/result.md): the caller sees in the signature
which failures it must handle. Reads are getters.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.aggregate.ts]
set total(total: number) {
	this.placedTotal = total;
}

place(total: number): void {
	if (this.isPlaced) {
		throw new OrderAlreadyPlaced();
	}
	this.placedTotal = total;
}
```

```ts [✅ Prefer: src/ordering/domain/aggregates/order.aggregate.ts]
place(total: number, eventId: string, now: Date): Result<void, OrderAlreadyPlaced> {
	if (this.isPlaced) {
		return err(new OrderAlreadyPlaced());
	}
	this.placedTotal = total;
	this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt: now, payload: { total } }));
	return ok();
}
```

</div>

::: details Why?
A setter lets any caller bypass the rules, and a thrown error does not appear in the signature.
The [`errors-as-values`](../../rules/errors-as-values.md) rule requires every public method of an
aggregate to return a `Result`.
:::

### Pass the time and the ids in

The domain never reads the clock nor generates ids. A business method that records an event takes
the event id and the current date as parameters; the
[command handler](../application/command-handlers.md) gets them from the `Clock` and
`IdGenerator` [ports](./ports.md).

```ts
const placed = order.place(total, this.ids.next(), this.clock.now());
```

Tests then pass fixed values and compare events exactly.

### Validate input in a factory

A static factory is the only way to create the aggregate, so creation rules go there. When the
input can be refused, return a `Result` instead of the aggregate.

```ts
static create(id: OrderId, lines: readonly OrderLine[]): Result<Order, EmptyOrder> {
	if (lines.length === 0) {
		return err(new EmptyOrder());
	}
	return ok(new Order(id, lines));
}
```

### Save and restore it with a snapshot

The state is private, so storage reads and writes it as a snapshot: plain data (strings, numbers,
booleans, `null`, `bigint`, `Date`, arrays and objects of them); a value object is written as its
fields. `toSnapshot()` is abstract and
returns it; a static `fromSnapshot(snapshot)` rebuilds the aggregate through its private
constructor. The snapshot type is declared with `type`, in the file of the aggregate.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
static fromSnapshot(snapshot: OrderSnapshot): Order {
	const order = new Order(new OrderId(snapshot.id));
	order.placedTotal = snapshot.total;
	return order;
}
```

`fromSnapshot` restores state: it checks no business rule and records no event. The
[entities](./entities.md) of the aggregate have their own snapshot, which the root composes. The
[command repository](./repositories.md) adapter maps the snapshot to its storage.

### Refer to other aggregates by identity

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.aggregate.ts]
private readonly customer: Customer;
```

```ts [✅ Prefer: src/ordering/domain/aggregates/order.aggregate.ts]
private readonly customerId: CustomerId;
```

</div>

Holding another aggregate merges two consistency boundaries without anyone deciding it. Checked by
[`reference-by-identity`](../../rules/reference-by-identity.md).

### Hand over recorded events

The aggregate records events; it never publishes them. After saving it, the command handler pulls
them and adds them to the [outbox](../application/outbox.md), in the same
[unit of work](../application/unit-of-work.md).

```ts
await this.orders.save(order);
await this.outbox.add(order.pullDomainEvents().map((event) => this.translator.translate(event, { correlationId })));
```

`domainEvents` reads the pending events without clearing them, for tests.

## Reference

```ts
abstract class AggregateRoot<
	Id extends AnyIdentifier,
	Event extends AnyDomainEvent = AnyDomainEvent,
	Snapshot extends AnySnapshot = AnySnapshot,
> extends Entity<Id, Snapshot>
```

| Type parameter | Description |
| --- | --- |
| `Id` | The [identifier](./value-objects.md#identifiers) of the aggregate. |
| `Event` | Union of the domain events it records. |
| `Snapshot` | The plain data its state is saved as. |

| Member | Type | Description |
| --- | --- | --- |
| `constructor(id)` | protected | Takes the identifier. |
| `id` | `Id` | Inherited from [`Entity`](./entities.md). |
| `domainEvents` | `readonly Event[]` | The recorded events, in order. Reading them does not clear them. |
| `pullDomainEvents()` | `Event[]` | Returns the recorded events, in order, and clears them. |
| `record(event)` | protected, `void` | Records an event. |
| `equals(other)` | `boolean` | Same class and equal identifiers. |
| `toSnapshot()` | abstract, `Snapshot` | Returns the state as plain data. |
| `fromSnapshot(snapshot)` | static, by convention | Rebuilds the aggregate. Written by you. |

`AnyAggregateRoot` is the type of any aggregate.

**Caveats**

- `domainEvents` returns a copy: changing it does not change the aggregate.
- TypeScript has no abstract static methods: `fromSnapshot` is a convention, not checked by the
  compiler.
- Declare the snapshot with `type`, not `interface`: an interface does not satisfy `AnySnapshot`.
- No version is kept: to prevent lost updates, put a `version` in your snapshot and check it in the
  repository adapter.

Import from `@alveolus/core` or `@alveolus/core/aggregates`.

## Troubleshooting

**`Type 'OrderSnapshot' does not satisfy the constraint 'AnySnapshot'`**: the snapshot is an
`interface`, or holds a value object or an entity. Declare it with `type` and write value objects
as plain fields.

## See also

- [Entities](./entities.md) and [Value objects](./value-objects.md), inside an aggregate
- [Domain events](./domain-events.md) and [Domain errors](./domain-errors.md), what it records and returns
- [Repositories](./repositories.md), to load and save it
- Rules: [`errors-as-values`](../../rules/errors-as-values.md), [`reference-by-identity`](../../rules/reference-by-identity.md), [`placement`](../../rules/placement.md)
