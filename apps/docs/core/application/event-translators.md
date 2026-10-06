# Event translators

An event translator turns the [domain events](../domain/domain-events.md) of an aggregate into
[integration events](./integration-events.md): plain JSON that other bounded contexts can read.

<dl class="al-glance">
	<dt>Layer</dt><dd>Application</dd>
	<dt>File</dt><dd><code>application/translators/order-events.translator.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>EventTranslator&lt;Event, Output&gt;</code></a></dd>
	<dt>Called by</dt><dd><a href="/core/application/command-handlers">Command handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/layers/no-outward-import"><code>layers/no-outward-import</code></a></dd>
</dl>

## Why

The billing context wants to know when an order is placed. Send it the `OrderPlaced` domain event
as is, and billing now depends on your classes: an `OrderId` object, a `Date`, field names you
chose for your own model. Rename one of them and billing breaks, without a single line of billing
changing.

::: tip The fix
An event translator maps each domain event to an integration event declared in your
[published language](../strategic/published-language.md): JSON, with a name and a version. It is
the one place where your model meets the contract other contexts read, so a refactoring of the
domain never reaches them by accident.
:::

## How it works

For each domain event it receives, the translator does three things:

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Recognize the event</span>Tell the events of the aggregate apart with <code>instanceof</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Write the contract</span>Choose the <code>type</code>, the <code>version</code> and a JSON <code>payload</code>: identifiers and value objects become strings and numbers.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Wrap it</span><code>wrap</code> adds the id and the date of the domain event, the <code>source</code> and the correlation ids.</div>
</div>

```ts
translate(
	event: OrderPlaced,
	context: IntegrationEventContext,
): OrderPlacedRepresentation {
	return this.wrap(event, context, {
		type: "OrderPlaced",
		version: 1,
		payload: {
			orderId: event.aggregateId.value,
			customerId: event.payload.customerId,
		},
	});
}
```

## Where it fits

The translator runs inside the command handler, after the aggregate is saved and before its events
go to the outbox. Before it, events are domain objects; after it, they are JSON.

<div class="al-diagram">
<svg viewBox="0 0 680 130" role="img" aria-label="The Order records an OrderPlaced domain event. The PlaceOrderHandler pulls it and gives it to the OrderEventsTranslator, which returns an integration event that the handler adds to the outbox.">
	<defs>
		<marker id="translator-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="36" width="130" height="56" rx="8" />
	<text class="label" x="73" y="60" text-anchor="middle">Order</text>
	<text class="note" x="73" y="80" text-anchor="middle">records event</text>
	<path class="link" d="M 138 64 L 168 64" marker-end="url(#translator-flow-arrow)" />
	<rect class="box" x="170" y="36" width="170" height="56" rx="8" />
	<text class="label" x="255" y="60" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="255" y="80" text-anchor="middle">pulls events</text>
	<path class="link" d="M 340 64 L 370 64" marker-end="url(#translator-flow-arrow)" />
	<rect class="boundary" x="372" y="36" width="180" height="56" rx="8" />
	<text class="label" x="462" y="60" text-anchor="middle">OrderEventsTranslator</text>
	<text class="note" x="462" y="80" text-anchor="middle">this page</text>
	<path class="link" d="M 552 64 L 582 64" marker-end="url(#translator-flow-arrow)" />
	<rect class="box" x="584" y="36" width="88" height="56" rx="8" />
	<text class="label" x="628" y="60" text-anchor="middle">Outbox</text>
	<text class="note" x="628" y="80" text-anchor="middle">JSON</text>
	<text class="note" x="173" y="116" text-anchor="middle">domain events</text>
	<text class="note" x="560" y="116" text-anchor="middle">integration events</text>
</svg>
</div>

::: tip
The domain never knows the translator. It records events in its own words; the application decides
what leaves the bounded context, and in which form.
:::

## API

```ts
import {
	EventTranslator,
	type IntegrationEventContext,
} from "@alveolus/core";
// or: from "@alveolus/core/event-translators"
```

### Type parameters

```ts
abstract class EventTranslator<
	Event extends AnyDomainEvent,
	Output extends AnyIntegrationEvent = AnyIntegrationEvent,
> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Event` | The domain events it translates: one class, or a union. | extends `DomainEvent` |
| `Output` | The integration events it produces, declared in the published language. | extends `IntegrationEvent`; any by default |

### `source` <Badge type="info" text="protected · abstract · readonly" /> <Badge type="tip" text="you implement it" />

```ts
protected abstract readonly source: string
```

The bounded context the events come from, such as `"ordering"`. `wrap` copies it into every
integration event.

### `translate(event, context)` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" /> <Badge type="tip" text="called by the command handler" />

```ts
abstract translate(
	event: Event,
	context: IntegrationEventContext,
): Output
```

Turns one domain event into its integration event. The command handler calls it for each pulled
event, before adding the result to the outbox.

### `wrap(event, context, contract)` <Badge type="info" text="protected" /> <Badge type="tip" text="inside your methods" />

```ts
protected wrap<Type extends string, Payload extends JsonValue>(
	event: Event,
	context: IntegrationEventContext,
	contract: {
		readonly type: Type;
		readonly version: number;
		readonly payload: Payload;
	},
): IntegrationEvent<Type, Payload>
```

Builds the integration event from the contract: copies `id` and `occurredAt` from the domain
event, and adds `source`, `correlationId` and, when the context has one, `causationId`.

::: warning Caveats
- `occurredAt` becomes an ISO 8601 string, and `causationId` is only set when the context has one.
- The payload type is constrained to `JsonValue`: an `Identifier` or a `Money` does not compile.
- The translator lives in the application layer: it reads the domain and the published language,
  and the domain never imports it.
:::

## Usage

Build the translator of the `Order` aggregate. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-declare-the-representation">Declare the representation</a></span>Know what you publish.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-translator">Declare the translator</a></span>One translator per aggregate.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-wrap-the-event">Wrap the event</a></span>Let wrap fill the envelope.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-publish-what-consumers-need">Publish what consumers need</a></span>Add the fields other contexts read.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-call-it-from-the-handler">Call it from the handler</a></span>Translate after saving.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Declare the representation

The translator produces an [integration event](./integration-events.md) declared in the published language of the context: `OrderPlacedRepresentation`. Declare it first.

### 2. Declare the translator

The translator extends `EventTranslator` with the domain events it reads and the representations it writes. `source` names the context that emits them, once for all its events.

```ts [src/ordering/application/translators/order-events.translator.ts]
import { EventTranslator } from "@alveolus/core";

import type {
	OrderPlaced,
} from "../../domain/events/order-placed.event";
import type {
	OrderPlacedRepresentation,
} from "../../published-language/order-placed.representation";

export class OrderEventsTranslator extends EventTranslator<
	OrderPlaced,
	OrderPlacedRepresentation
> {
	protected readonly source = "ordering";
}
```

TypeScript now asks for `translate()`: the next step adds it.

### 3. Wrap the event

So that every event carries the same envelope, `translate` gives `wrap` only the name, the version and the payload: `wrap` fills the id, the source, the date and the correlation. The payload holds plain values, never an identifier or a value object.

```ts [src/ordering/application/translators/order-events.translator.ts]
import { EventTranslator } from "@alveolus/core"; // [!code --]
import { // [!code ++]
	EventTranslator, // [!code ++]
	type IntegrationEventContext, // [!code ++]
} from "@alveolus/core"; // [!code ++]

import type {
	OrderPlaced,
} from "../../domain/events/order-placed.event";
import type {
	OrderPlacedRepresentation,
} from "../../published-language/order-placed.representation";

export class OrderEventsTranslator extends EventTranslator<
	OrderPlaced,
	OrderPlacedRepresentation
> {
	protected readonly source = "ordering";

	translate( // [!code ++]
		event: OrderPlaced, // [!code ++]
		context: IntegrationEventContext, // [!code ++]
	): OrderPlacedRepresentation { // [!code ++]
		return this.wrap(event, context, { // [!code ++]
			type: "OrderPlaced", // [!code ++]
			version: 1, // [!code ++]
			payload: { // [!code ++]
				orderId: event.aggregateId.value, // [!code ++]
			}, // [!code ++]
		}); // [!code ++]
	} // [!code ++]
}
```

### 4. Publish what consumers need

A consumer cannot load the order: everything it needs must be in the payload. Add the customer, as a plain string read from the domain event.

```ts [src/ordering/application/translators/order-events.translator.ts]
import {
	EventTranslator,
	type IntegrationEventContext,
} from "@alveolus/core";

import type {
	OrderPlaced,
} from "../../domain/events/order-placed.event";
import type {
	OrderPlacedRepresentation,
} from "../../published-language/order-placed.representation";

export class OrderEventsTranslator extends EventTranslator<
	OrderPlaced,
	OrderPlacedRepresentation
> {
	protected readonly source = "ordering";

	translate(
		event: OrderPlaced,
		context: IntegrationEventContext,
	): OrderPlacedRepresentation {
		return this.wrap(event, context, {
			type: "OrderPlaced",
			version: 1,
			payload: {
				orderId: event.aggregateId.value,
				customerId: event.payload.customerId, // [!code ++]
			},
		});
	}
}
```

This is the complete translator.

### 5. Call it from the handler

The [command handler](./command-handlers.md#usage) translates each event it pulls from the order, after saving it, and adds the results to the [outbox](./outbox.md).

```ts [src/ordering/application/commands/place-order.command.ts]
await this.orders.save(order);
const events = order
	.pullDomainEvents()
	.map((event) =>
		this.translator.translate(event, {
			correlationId: orderId,
		}),
	);
await this.outbox.add(events);
```

### 6. Check it

Run the checks. Two rules keep the translator the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>application/translators/*.translator.ts</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-outward-import"><code>no-outward-import</code></a></span>It imports the domain, the application and its own published language, never an adapter.</div>
</div>

An import of a database adapter is reported:

```
src/ordering/application/translators/order-events.translator.ts:3
  layers/no-outward-import: The application layer imports
  src/ordering/driven/pg/adapters/pg-orders.adapter.ts
  (ordering driven): it may only import domain, application,
  published-language.
```

## See also

- [Integration events](./integration-events.md), what it produces
- [Domain events](../domain/domain-events.md), what it reads
- [Published Language](../strategic/published-language.md), where the contracts are declared
- [Outbox](./outbox.md), where the translated events go
