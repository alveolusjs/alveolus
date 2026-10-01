# Domain events

A domain event records something that happened in the domain, named in the past tense:
`OrderPlaced`, `OrderCancelled`. The aggregate records it when its state changes; the application
decides what to do with it afterwards.

```ts
export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}
```

## When to use

Record an event for every change that something else may care about: another aggregate, another
bounded context, a projection, an audit trail. The aggregate does not know who reacts; it only says
what happened.

## Usage

### Declare an event

One class per event, extending `DomainEvent` with the identifier of the aggregate and the type of
its payload. The class has no body: everything it carries is in the payload.

```ts [src/ordering/domain/events/order-placed.event.ts]
import { DomainEvent } from "@alveolus/core";

import type { OrderId } from "../value-objects/order-id.identifier";

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}
```

An event without data takes `null` as payload: `DomainEvent<OrderId, null>`.

### Record it from the aggregate

The aggregate builds the event in its business method and calls `record`. The event id and the date
come in as parameters: the domain never generates ids nor reads the clock.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
place(total: number, eventId: string, now: Date): Result<void, OrderAlreadyPlaced> {
	if (this.isPlaced) {
		return err(new OrderAlreadyPlaced());
	}
	this.placedTotal = total;
	this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt: now, payload: { total } }));
	return ok();
}
```

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.aggregate.ts]
this.record(new OrderPlaced({ aggregateId: this.id, id: randomUUID(), occurredAt: new Date(), payload: { total } }));
```

```ts [✅ Prefer: src/ordering/application/commands/place-order.command.ts]
const placed = order.place(total, this.ids.next(), this.clock.now());
```

</div>

::: details Why?
An aggregate that reads the clock or draws random ids gives a different result on every run: tests
cannot compare events, and replaying a change is impossible. The command handler gets both from the
`Clock` and `IdGenerator` [ports](./ports.md).
:::

### Test it

Fixed ids and dates make events comparable as a whole.

```ts [src/ordering/domain/aggregates/order.aggregate.spec.ts]
const order = Order.create(id);
order.place(42, "event_1", now);

expect(order.domainEvents).toEqual([new OrderPlaced({ aggregateId: id, id: "event_1", occurredAt: now, payload: { total: 42 } })]);
```

### Tell events apart

Use `instanceof` on the event class. An event has no `type` string: its name in a contract
belongs to the [published language](../strategic/published-language.md), chosen by an
[event translator](../application/event-translators.md).

```ts
if (event instanceof OrderPlaced) {
	return this.wrap(event, context, { payload: { orderId: event.aggregateId.value, total: event.payload.total }, type: "OrderPlaced", version: 1 });
}
```

### Send it outside the bounded context

A domain event stays inside its context. To tell other contexts, the command handler translates it
into an [integration event](../application/integration-events.md), plain JSON, and adds it to the
[outbox](../application/outbox.md). Renaming a domain event or one of its fields then changes
nothing for the other contexts.

## Reference

```ts
abstract class DomainEvent<Id extends AnyIdentifier = AnyIdentifier, Payload = unknown>

interface DomainEventProps<Id extends AnyIdentifier, Payload> {
	readonly id: string;
	readonly aggregateId: Id;
	readonly occurredAt: Date;
	readonly payload: Payload;
}
```

| Type parameter | Description |
| --- | --- |
| `Id` | The identifier of the aggregate that recorded the event. |
| `Payload` | The data of the event. |

| Member | Type | Description |
| --- | --- | --- |
| `constructor(props)` | public, `DomainEventProps<Id, Payload>` | Builds the event. |
| `id` | `string` | The unique id of the event, used to ignore duplicates downstream. |
| `aggregateId` | `Id` | The aggregate that recorded it. |
| `occurredAt` | `Date` | When it happened. |
| `payload` | `Payload` | Its data. |

`AnyDomainEvent` is the type of any domain event.

**Caveats**

- `occurredAt` is copied: changing the date you passed does not change the event.
- The payload is not frozen and may hold value objects and identifiers: it is internal to the
  context. Keep it read-only by convention.
- Keep one event class per file, in `domain/events/` ([`placement`](../../rules/placement.md)).

Import from `@alveolus/core` or `@alveolus/core/domain-events`.

## See also

- [Aggregates](./aggregates.md), which record events
- [Event translators](../application/event-translators.md) and [Integration events](../application/integration-events.md), to publish them
- [Outbox](../application/outbox.md), so none is lost
