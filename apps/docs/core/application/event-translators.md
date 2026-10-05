# Event translators

An event translator turns the [domain events](../domain/domain-events.md) of an aggregate into
[integration events](./integration-events.md): plain JSON in the published language of the bounded
context. It is the one place where the internal model meets the contract other contexts read.

```ts
export class OrderEventsTranslator extends EventTranslator<OrderPlaced, OrderPlacedRepresentation> {
	protected readonly source = "ordering";

	translate(event: OrderPlaced, context: IntegrationEventContext): OrderPlacedRepresentation {
		return this.wrap(event, context, { payload: { orderId: event.aggregateId.value, total: event.payload.total }, type: "OrderPlaced", version: 1 });
	}
}
```

## When to use

Write one translator per aggregate whose events leave the bounded context. The domain keeps its own
types, such as identifiers and value objects; the translator decides what is published and in which
form, so a refactoring of the domain never reaches other contexts by accident.

## Usage

### Translate the events of an aggregate

`Event` is the union of the domain events of the aggregate, `Output` the union of the integration
events declared in the [published language](../strategic/published-language.md). Tell the events
apart with `instanceof`, and `wrap` each one: `wrap` copies `id` and `occurredAt` from the domain
event, adds `source` and the context, and takes the `type`, `version` and `payload` you give.

```ts [src/ordering/application/translators/order-events.translator.ts]
import { EventTranslator, type IntegrationEventContext } from "@alveolus/core";

import { OrderPlaced } from "../../domain/events/order-placed.event";
import type { OrderEvent } from "../../domain/events/order.event";
import type { OrderingEvent } from "../../published-language/ordering-event.representation";

export class OrderEventsTranslator extends EventTranslator<OrderEvent, OrderingEvent> {
	protected readonly source = "ordering";

	translate(event: OrderEvent, context: IntegrationEventContext): OrderingEvent {
		if (event instanceof OrderPlaced) {
			return this.wrap(event, context, {
				payload: { currency: event.payload.total.currency, orderId: event.aggregateId.value, total: event.payload.total.amount },
				type: "OrderPlaced",
				version: 1,
			});
		}
		return this.wrap(event, context, { payload: { orderId: event.aggregateId.value }, type: "OrderCancelled", version: 1 });
	}
}
```

`OrderingEvent` is the union of the representations, such as
`OrderPlacedRepresentation | OrderCancelledRepresentation`: TypeScript rejects a `type` or a payload
the contract does not declare.

### Call it from the command handler

Inject the translator and map the events pulled from the aggregate, inside the
[unit of work](./unit-of-work.md), after saving.

```ts [src/ordering/application/commands/place-order.command.ts]
await this.orders.save(order);
await this.outbox.add(order.pullDomainEvents().map((event) => this.translator.translate(event, { correlationId: orderId })));
```

### Keep domain objects out of the payload

The payload is JSON: identifiers and value objects are written as strings and numbers.

<div class="al-compare">

```ts [❌ Avoid]
payload: { order: event.aggregateId, total: event.payload.total }
```

```ts [✅ Prefer]
payload: { orderId: event.aggregateId.value, total: event.payload.total.amount }
```

</div>

The payload type is constrained to `JsonValue`: an `Identifier` or a `Money` does not compile.

### Chain operations

When the change was caused by another message, pass its id as `causationId` and keep its
`correlationId`: the whole chain can be followed across contexts.

```ts
this.translator.translate(event, { causationId: received.id, correlationId: received.correlationId });
```

## Reference

```ts
abstract class EventTranslator<Event extends AnyDomainEvent, Output extends AnyIntegrationEvent = AnyIntegrationEvent> {
	protected abstract readonly source: string;
	abstract translate(event: Event, context: IntegrationEventContext): Output;
	protected wrap<Type extends string, Payload extends JsonValue>(
		event: Event,
		context: IntegrationEventContext,
		contract: { readonly type: Type; readonly version: number; readonly payload: Payload },
	): IntegrationEvent<Type, Payload>;
}
```

| Type parameter | Description |
| --- | --- |
| `Event` | The domain events it translates. |
| `Output` | The integration events it produces. Defaults to any integration event. |

| Member | Type | Description |
| --- | --- | --- |
| `source` | `string`, protected abstract | The bounded context the events come from. |
| `translate(event, context)` | `Output` | Turns one domain event into its integration event. |
| `wrap(event, context, contract)` | `IntegrationEvent<Type, Payload>`, protected | Builds the integration event from `{ type, version, payload }`, with `id`, `occurredAt`, `source`, `correlationId` and `causationId` filled in. |

**Caveats**

- `occurredAt` becomes an ISO 8601 string, and `causationId` is only set when the context has one.
- The translator lives in the application layer: it reads the domain and the published language,
  the domain never knows it.

Import from `@alveolus/core` or `@alveolus/core/event-translators`.

## See also

- [Integration events](./integration-events.md), what it produces
- [Published Language](../strategic/published-language.md), where the contracts are declared
- [Outbox](./outbox.md), where the translated events go
