# Integration events

An integration event is what other bounded contexts receive when something happens in yours: plain
JSON in your [published language](../strategic/published-language.md), with an explicit type, a
schema version and the operation it belongs to. The [domain event](../domain/domain-events.md) stays
internal; an [event translator](./event-translators.md) builds the integration event.

```ts
type OrderPlacedRepresentation = PublishedLanguage<IntegrationEvent<"OrderPlaced", { orderId: string; total: number }>>;
```

## When to use

Declare one integration event for every domain event that leaves the bounded context. Because it is
JSON, the [outbox](./outbox.md) stores it and reads it back as is, a broker carries it, and the
consumer reads it without sharing a single class with you. Renaming a domain event or one of its
fields changes nothing for the other contexts.

## Usage

### Declare the events you publish

Declare them in the published language of the bounded context. `type` is a string you choose, not a
class name; `payload` holds only JSON.

```ts [src/ordering/published-language/order-placed.representation.ts]
import type { IntegrationEvent, PublishedLanguage } from "@alveolus/core";

export type OrderPlacedRepresentation = PublishedLanguage<IntegrationEvent<"OrderPlaced", { orderId: string; total: number; currency: string }>>;
```

### Evolve an event

Raise `version` when the payload changes in a way consumers must know about, and keep publishing the
old version while they move.

```ts [src/ordering/published-language/order-placed-v2.representation.ts]
export type OrderPlacedV2Representation = PublishedLanguage<
	IntegrationEvent<"OrderPlaced", { orderId: string; total: { amount: number; currency: string } }>
>;
```

### Consume an event from another context

The consumer redeclares, in its own published language, the fields it reads; it never imports the
types of the emitter. It deduplicates by `id`: delivery is at least once.

```ts [src/billing/published-language/order-placed.representation.ts]
export type OrderPlacedRepresentation = PublishedLanguage<IntegrationEvent<"OrderPlaced", { orderId: string; total: number }>>;
```

Checked by [`bc-isolation`](../../rules/bc-isolation.md), which forbids importing another context's
published language.

## Reference

```ts
type IntegrationEvent<Type extends string = string, Payload extends JsonValue = JsonValue> = PublishedLanguage<{
	readonly id: string;
	readonly type: Type;
	readonly version: number;
	readonly source: string;
	readonly occurredAt: string;
	readonly correlationId: string;
	readonly causationId?: string;
	readonly payload: Payload;
}>;

interface IntegrationEventContext {
	readonly correlationId: string;
	readonly causationId?: string;
}
```

| Type parameter | Description |
| --- | --- |
| `Type` | The name of the event in the contract. |
| `Payload` | The JSON data of the event. |

| Member | Type | Description |
| --- | --- | --- |
| `id` | `string` | The id of the domain event, used to deduplicate. |
| `type` | `Type` | The name of the event in the contract. |
| `version` | `number` | The version of the payload schema. |
| `source` | `string` | The bounded context that emitted the event. |
| `occurredAt` | `string` | When the domain event happened, as an ISO 8601 string. |
| `correlationId` | `string` | The operation the event belongs to, across contexts. |
| `causationId` | `string`, optional | The message that caused this event. |
| `payload` | `Payload` | The data of the event. |

**Caveats**

- `IntegrationEvent` is a type: nothing exists at runtime. Build values with an
  [event translator](./event-translators.md).
- One integration event per domain event: both share the same `id`.
- `AnyIntegrationEvent` is any integration event, used by the outbox and the publisher.
  `IntegrationEventContext` is what a command handler passes to the translator.

Import from `@alveolus/core` or `@alveolus/core/integration-events`.

## See also

- [Event translators](./event-translators.md), which build integration events
- [Outbox](./outbox.md) and [Event publishers](./event-publishers.md), which store and send them
- [Published Language](../strategic/published-language.md)
