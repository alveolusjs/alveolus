---
description: "Domain events in Domain-Driven Design with TypeScript: record what happened in the domain, named in the past tense, such as OrderPlaced."
---

# Domain events

A domain event records something that happened in the domain, named in the past tense, such as
`OrderPlaced`.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain</dd>
	<dt>File</dt><dd><code>domain/events/order-placed.event.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>DomainEvent&lt;Id, Payload&gt;</code></a></dd>
	<dt>Recorded by</dt><dd><a href="/core/domain/aggregates">Aggregates</a></dd>
	<dt>Read by</dt><dd><a href="/core/application/command-handlers">Command handlers</a>, <a href="/core/application/event-translators">event translators</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></dd>
</dl>

## Why

When an order is placed, billing must invoice it and the customer must get an email. If
`Order.place` calls billing and the mailer, the domain depends on them, and an order cannot be placed
while the mail server is down. If the handler compares the order before and after to guess what
changed, the rule is written twice.

::: tip The fix
`Order.place` records `OrderPlaced`: a plain fact, with what others need to know. The order does
not know who reacts. The application hands the fact over after saving, and each listener decides
what to do with it.
:::

## How it works

An event is a small immutable object: an id, the identifier of the aggregate that recorded it, the
date, and a payload. It goes through three hands:

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>The aggregate records it</span>Its business method calls <code>this.record(event)</code> after changing the state.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>The handler pulls it</span>After saving, the <a href="/core/application/command-handlers">command handler</a> calls <code>pullDomainEvents()</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>A translator sends it on</span>An <a href="/core/application/event-translators">event translator</a> turns it into JSON, added to the <a href="/core/application/outbox">outbox</a>.</div>
</div>

```ts
this.record(
	new OrderPlaced({
		id: eventId,
		aggregateId: this.id,
		occurredAt: now,
		payload: { customerId: this.customerId.value },
	}),
);
```

## Where it fits

<div class="al-diagram">
<svg viewBox="0 0 680 120" role="img" aria-label="Order.place records OrderPlaced. The command handler pulls it after saving, an event translator turns it into an integration event, and the outbox stores it.">
	<defs>
		<marker id="domain-event-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="32" width="148" height="56" rx="8" />
	<text class="label" x="82" y="56" text-anchor="middle">Order</text>
	<text class="note" x="82" y="76" text-anchor="middle">place() records</text>
	<path class="link" d="M 156 60 L 178 60" marker-end="url(#domain-event-flow-arrow)" />
	<rect class="boundary" x="180" y="32" width="148" height="56" rx="8" />
	<text class="label" x="254" y="56" text-anchor="middle">OrderPlaced</text>
	<text class="note" x="254" y="76" text-anchor="middle">this page</text>
	<path class="link" d="M 328 60 L 350 60" marker-end="url(#domain-event-flow-arrow)" />
	<rect class="box" x="352" y="32" width="148" height="56" rx="8" />
	<text class="label" x="426" y="56" text-anchor="middle">Translator</text>
	<text class="note" x="426" y="76" text-anchor="middle">translate(event)</text>
	<path class="link" d="M 500 60 L 522 60" marker-end="url(#domain-event-flow-arrow)" />
	<rect class="box" x="524" y="32" width="148" height="56" rx="8" />
	<text class="label" x="598" y="56" text-anchor="middle">Outbox</text>
	<text class="note" x="598" y="76" text-anchor="middle">add(events)</text>
</svg>
</div>

::: tip
A domain event never leaves its bounded context. Other contexts receive an
[integration event](../application/integration-events.md), plain JSON: renaming a domain event or
one of its fields then changes nothing for them.
:::

## API

```ts
import { DomainEvent } from "@alveolus/core";
// or: import { DomainEvent } from "@alveolus/core/domain-events";
```

### Type parameters

```ts
abstract class DomainEvent<
	Id extends AnyIdentifier = AnyIdentifier,
	Payload = unknown,
> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Id` | The identifier of the aggregate that records the event. | extends `Identifier`; any by default |
| `Payload` | The data of the event. `null` for an event without data. | any; `unknown` by default |

`AnyDomainEvent` is the type of any domain event.

### `constructor(props)` <Badge type="tip" text="you call it" />

```ts
constructor(props: DomainEventProps<Id, Payload>)
```

Creates the event, inside a method of the aggregate. `props` holds `id`, from the `IdGenerator`
port, `aggregateId`, `occurredAt`, from the `Clock` port, and `payload`. `occurredAt` is copied.
An event has no body: declare the class only.

```ts
class OrderPlaced extends DomainEvent<
	OrderId,
	{ readonly customerId: string }
> {}
```

### `id` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by translators and consumers" />

```ts
readonly id: string
```

The unique id of the event, used downstream to ignore duplicates.

### `aggregateId` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by translators" />

```ts
readonly aggregateId: Id
```

The identifier of the aggregate that recorded the event.

### `occurredAt` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by translators" />

```ts
readonly occurredAt: Date
```

When it happened.

### `payload` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by translators" />

```ts
readonly payload: Payload
```

The data of the event.

::: warning Caveats
- `occurredAt` is copied: changing the date you passed does not change the event.
- The payload is not frozen and may hold value objects and identifiers: it is internal to the
  context. Keep it read-only by convention.
- An event has no `type` string: tell events apart with `instanceof`.
:::

## Usage

Build `OrderPlaced`, the event the `Order` aggregate records when it is placed, then follow it out
of the aggregate. Each step shows the whole file it changes: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-know-who-records-it">Know who records it</a></span>The aggregate it belongs to.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-event">Declare the event</a></span>One class per fact.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-carry-what-consumers-need">Carry what consumers need</a></span>A read-only payload.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-record-it-in-the-aggregate">Record it in the aggregate</a></span>Where the change happens.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-hand-it-over-after-saving">Hand it over after saving</a></span>Pulled, translated, stored.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Know who records it

An event belongs to the aggregate that records it: here the [`Order` aggregate](./aggregates.md),
known by its `OrderId`.

### 2. Declare the event

So that the rest of the system can react to a fact by its type, each event is a class named in the
past tense, in its own file. `null` says it carries no data yet.

```ts [src/ordering/domain/events/order-placed.event.ts]
import { DomainEvent } from "@alveolus/core";

import type { OrderId } from "../value-objects/order-id.identifier";

export class OrderPlaced extends DomainEvent<OrderId, null> {}
```

### 3. Carry what consumers need

Consumers must not have to load the order again: the payload carries the data they need,
read-only.

```ts [src/ordering/domain/events/order-placed.event.ts]
import { DomainEvent } from "@alveolus/core";

import type { OrderId } from "../value-objects/order-id.identifier";

export class OrderPlaced extends DomainEvent<OrderId, null> {} // [!code --]
export class OrderPlaced extends DomainEvent< // [!code ++]
	OrderId, // [!code ++]
	{ readonly customerId: string } // [!code ++]
> {} // [!code ++]
```

The payload stays inside the context: an [event translator](../application/event-translators.md)
turns it into the published language before it leaves.

### 4. Record it in the aggregate

The event is created where the change happens, in the business method, with the event id and the
date passed in: the aggregate never reads a clock nor generates an id.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
place(
	eventId: string,
	now: Date,
): Result<void, OrderAlreadyPlaced | EmptyOrder> {
	if (this.isPlaced) {
		return err(new OrderAlreadyPlaced());
	}
	if (this.lines.length === 0) {
		return err(new EmptyOrder());
	}
	this.status = "placed";
	this.record(
		new OrderPlaced({
			id: eventId,
			aggregateId: this.id,
			occurredAt: now,
			payload: { customerId: this.customerId.value },
		}),
	);
	return ok();
}
```

### 5. Hand it over after saving

So that no event leaves for a change that was not saved, the
[command handler](../application/command-handlers.md) pulls the events after `save` and adds them
to the [outbox](../application/outbox.md), in the same unit of work.

```ts [src/ordering/application/commands/place-order.command.ts]
await this.orders.save(order);
const events = order
	.pullDomainEvents()
	.map((event) =>
		this.translator.translate(event, { correlationId }),
	);
await this.outbox.add(events);
```

### 6. Check it

Run the checks. Three rules keep the event the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>domain/events/*.event.ts</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-impure-domain"><code>no-impure-domain</code></a></span>Its payload uses domain types and plain data, no framework.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-plain-class"><code>no-plain-class</code></a></span>The fact is a <code>DomainEvent</code>, not a plain class.</div>
</div>

An event declared next to its aggregate is reported:

```
src/ordering/domain/aggregates/order.aggregate.ts:12
  tactical/no-misplaced-class: OrderPlaced belongs in
  domain/events/*.event.ts.
```

## See also

- [Aggregates](./aggregates.md), which record events
- [Event translators](../application/event-translators.md) and [Integration events](../application/integration-events.md), to publish them
- [Outbox](../application/outbox.md), so none is lost
- Rules: [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
- Vaughn Vernon, *Domain-Driven Design Distilled*, chapter 6, "Tactical Design with Domain Events"
- Vaughn Vernon, *Implementing Domain-Driven Design*, chapter 8, "Domain Events"
