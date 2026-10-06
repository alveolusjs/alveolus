# Integration events

An integration event is what other bounded contexts receive when something happens in yours: plain
JSON with a name, a version and the operation it belongs to.

<dl class="al-glance">
	<dt>Layer</dt><dd>Published language</dd>
	<dt>File</dt><dd><code>published-language/order-placed.representation.ts</code></dd>
	<dt>Type</dt><dd><a href="#api"><code>IntegrationEvent&lt;Type, Payload&gt;</code></a></dd>
	<dt>Built by</dt><dd><a href="/core/application/event-translators">Event translators</a></dd>
	<dt>Used by</dt><dd><a href="/core/application/outbox">Outbox</a>, <a href="/core/application/event-publishers">Event publishers</a>, consumers in other contexts</dd>
	<dt>Checked by</dt><dd><a href="/rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a>, <a href="/rules/layers/no-outward-import"><code>layers/no-outward-import</code></a></dd>
</dl>

## Why

When an order is placed, billing must know. The `OrderPlaced` domain event is a class holding an
`OrderId` and a `Date`: it cannot be stored in the outbox and read back as is, a broker cannot carry
it, and billing would have to import your classes to read it. Every change to your model would
become a change to billing.

::: tip The fix
An integration event is a JSON type you declare in your
[published language](../strategic/published-language.md). It is stored, carried and read as is, and
the consumer shares no code with you. The [domain event](../domain/domain-events.md) stays internal;
an [event translator](./event-translators.md) builds the integration event from it.
:::

## How it works

Every integration event carries the same envelope around its payload:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Identity</span><code>id</code> is the id of the domain event. Consumers use it to ignore a duplicate.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Contract</span><code>type</code> names the event and <code>version</code> the shape of its payload.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Origin</span><code>source</code> is the bounded context, <code>occurredAt</code> the date, as an ISO 8601 string.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span>Tracing</span><code>correlationId</code> is the operation it belongs to; <code>causationId</code> the message that caused it.</div>
</div>

```json
{
	"id": "0b8f6c1e-5d2a-4c4e-9a51-3f7c2e1d9b40",
	"type": "OrderPlaced",
	"version": 1,
	"source": "ordering",
	"occurredAt": "2026-10-05T09:30:00.000Z",
	"correlationId": "order-42",
	"payload": { "orderId": "order-42", "customerId": "customer-7" }
}
```

## Where it fits

The integration event is born in the command handler, from a translated domain event, and travels
as JSON until another context reads it.

<div class="al-diagram">
<svg viewBox="0 0 680 150" role="img" aria-label="The event translator builds the integration event, the outbox stores it, the event publisher sends it, and the billing context consumes it. The integration event travels as JSON across all of them.">
	<defs>
		<marker id="integration-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="24" width="150" height="56" rx="8" />
	<text class="label" x="83" y="48" text-anchor="middle">Translator</text>
	<text class="note" x="83" y="68" text-anchor="middle">builds it</text>
	<path class="link" d="M 158 52 L 180 52" marker-end="url(#integration-flow-arrow)" />
	<rect class="box" x="182" y="24" width="150" height="56" rx="8" />
	<text class="label" x="257" y="48" text-anchor="middle">Outbox</text>
	<text class="note" x="257" y="68" text-anchor="middle">stores it</text>
	<path class="link" d="M 332 52 L 354 52" marker-end="url(#integration-flow-arrow)" />
	<rect class="box" x="356" y="24" width="150" height="56" rx="8" />
	<text class="label" x="431" y="48" text-anchor="middle">Event publisher</text>
	<text class="note" x="431" y="68" text-anchor="middle">sends it</text>
	<path class="link" d="M 506 52 L 528 52" marker-end="url(#integration-flow-arrow)" />
	<rect class="box" x="530" y="24" width="142" height="56" rx="8" />
	<text class="label" x="601" y="48" text-anchor="middle">Billing</text>
	<text class="note" x="601" y="68" text-anchor="middle">reads it</text>
	<rect class="boundary" x="8" y="100" width="664" height="36" rx="8" />
	<text class="note" x="340" y="123" text-anchor="middle">this page: OrderPlaced v1, the same JSON all the way</text>
</svg>
</div>

::: tip
Delivery is at least once: the same event may arrive twice. Consumers deduplicate by `id`.
:::

## API

```ts
import type {
	IntegrationEvent,
	PublishedLanguage,
} from "@alveolus/core";
// or: from "@alveolus/core/integration-events"
```

`IntegrationEvent` is a type: nothing exists at runtime. Values are built by an
[event translator](./event-translators.md).

### Type parameters

```ts
type IntegrationEvent<
	Type extends string = string,
	Payload extends JsonValue = JsonValue,
> = PublishedLanguage<{ … }>;
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Type` | The name of the event in the contract. | extends `string` |
| `Payload` | The data of the event. | extends `JsonValue` |

### Fields you declare

| Field | What it is |
| --- | --- |
| `type` | The name of the event in the contract, such as `"OrderPlaced"`. A string you choose, not a class name. |
| `payload` | The data of the event, in JSON only. |

### Fields filled for you

The [event translator](./event-translators.md) fills them through `wrap`.

| Field | Type | What it is |
| --- | --- | --- |
| `id` | `string` | The id of the domain event, used to deduplicate. |
| `version` | `number` | The version of the payload schema, given to `wrap`. |
| `source` | `string` | The bounded context that emitted the event. |
| `occurredAt` | `string` | When the domain event happened, as an ISO 8601 string. |
| `correlationId` | `string` | The operation the event belongs to, across contexts. |
| `causationId` | `string`, optional | The message that caused this event. |

### `IntegrationEventContext` <Badge type="info" text="type" /> <Badge type="tip" text="passed by the command handler" />

```ts
interface IntegrationEventContext {
	readonly correlationId: string;
	readonly causationId?: string;
}
```

Passed to `translate`: its values become the `correlationId` and `causationId` of the event.
Import it from `@alveolus/core` as a type.

### `AnyIntegrationEvent` <Badge type="info" text="type" /> <Badge type="tip" text="used by the outbox and the publisher" />

```ts
type AnyIntegrationEvent = IntegrationEvent;
```

Any integration event, whatever its type and payload.

::: warning Caveats
- One integration event per domain event: both share the same `id`.
- The payload type is constrained to `JsonValue`: a class, a `Date` or `undefined` does not
  compile.
:::

## Usage

Build the event that ordering publishes when an order is placed. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-start-from-the-domain-event">Start from the domain event</a></span>Know what happened.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-name-it-in-the-contract">Name it in the contract</a></span>A type and a name that never change.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-publish-what-consumers-need">Publish what consumers need</a></span>Plain fields, nothing internal.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-mark-it-as-published-language">Mark it as published language</a></span>Say it is a contract.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-build-it-in-a-translator">Build it in a translator</a></span>One place turns events into JSON.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Start from the domain event

An integration event announces a [domain event](../domain/domain-events.md), here `OrderPlaced`, to other contexts: it exists first.

### 2. Name it in the contract

Other contexts depend on the name, not on a class: give the event a stable `type` string and a payload in JSON only. The file lives in `published-language/`, where other contexts look.

```ts [src/ordering/published-language/order-placed.representation.ts]
import type { IntegrationEvent } from "@alveolus/core";

export type OrderPlacedRepresentation = IntegrationEvent<
	"OrderPlaced",
	{ readonly orderId: string }
>;
```

### 3. Publish what consumers need

A consumer cannot load the order: add every field it needs, as plain JSON values. An identifier or a `Date` would not compile.

```ts [src/ordering/published-language/order-placed.representation.ts]
import type { IntegrationEvent } from "@alveolus/core";

export type OrderPlacedRepresentation = IntegrationEvent<
	"OrderPlaced",
	{ readonly orderId: string } // [!code --]
	{ readonly orderId: string; readonly customerId: string } // [!code ++]
>;
```

### 4. Mark it as published language

`PublishedLanguage` says that this type is a contract with other contexts: changing it means a new `version`, not an edit.

```ts [src/ordering/published-language/order-placed.representation.ts]
import type { IntegrationEvent } from "@alveolus/core"; // [!code --]
import type { // [!code ++]
	IntegrationEvent, // [!code ++]
	PublishedLanguage, // [!code ++]
} from "@alveolus/core"; // [!code ++]

export type OrderPlacedRepresentation = IntegrationEvent< // [!code --]
	"OrderPlaced", // [!code --]
	{ readonly orderId: string; readonly customerId: string } // [!code --]
export type OrderPlacedRepresentation = PublishedLanguage< // [!code ++]
	IntegrationEvent< // [!code ++]
		"OrderPlaced", // [!code ++]
		{ readonly orderId: string; readonly customerId: string } // [!code ++]
	> // [!code ++]
>;
```

This is the complete representation.

### 5. Build it in a translator

The [event translator](./event-translators.md#usage) builds the value, and the outbox stores it as this JSON:

```json
{
	"id": "0b9f6c1e-4d1a-4c8e-9a51-2f3e7d6b8a10",
	"type": "OrderPlaced",
	"version": 1,
	"source": "ordering",
	"occurredAt": "2026-10-06T09:30:00.000Z",
	"correlationId": "o-42",
	"payload": { "orderId": "o-42", "customerId": "c-7" }
}
```

### 6. Check it

Run the checks. Two rules keep the representation the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/strategic/no-cross-context-import"><code>no-cross-context-import</code></a></span>A consumer redeclares the fields it reads: it never imports this type.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-outward-import"><code>no-outward-import</code></a></span>The published language imports only its own types and the published-language types of core.</div>
</div>

A consumer that imports it from ordering is reported:

```
src/shipping/published-language/order-placed.representation.ts:1
  strategic/no-cross-context-import: Imports the published
  language of ordering: redeclare the fields you read in your
  own published-language/.
```

## See also

- [Event translators](./event-translators.md), which build integration events
- [Outbox](./outbox.md) and [Event publishers](./event-publishers.md), which store and send them
- [Domain events](../domain/domain-events.md), what they are built from
- [Published Language](../strategic/published-language.md), where they are declared
- Rules: [`strategic/no-cross-context-import`](../../rules/strategic/no-cross-context-import.md), [`layers/no-outward-import`](../../rules/layers/no-outward-import.md)
