# Domain Events

A domain event is something that happened in the domain that the business cares about, named in
the past tense. Aggregates record events when their state changes; your application publishes them
once the aggregate is saved.

```ts
export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}
```

## When to use

Record an event when other parts of the system need to react to a change: send a confirmation,
update a read model, start a process in another bounded context. The event says what happened, not
what to do next.

## Usage

### Declare an event

One class per event, named in the past tense, with the identifier of its aggregate and a typed
payload. The event `type` is the class name.

```ts [src/ordering/domain/events/order-placed.event.ts]
import { DomainEvent } from "@alveolus/core";
import type { OrderId } from "../value-objects/order-id.identifier.ts";

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}
```

### Record an event

The [aggregate](./aggregates.md) creates the event in a business method and records it. The date
comes from the caller.

```ts
this.record(
	new OrderPlaced({ aggregateId: this.id, occurredAt: now, payload: { total } }),
);
```

### Read an event

```ts
event.type; // "OrderPlaced"
event.aggregateId; // OrderId
event.occurredAt; // Date
event.payload.total; // number
```

## Reference

```ts
abstract class DomainEvent<
	Id extends AnyIdentifier = AnyIdentifier,
	Payload = unknown,
>
```

| Type parameter | Description                                        |
| -------------- | -------------------------------------------------- |
| `Id`           | The identifier of the aggregate the event belongs to. |
| `Payload`      | The data carried by the event.                     |

| Member               | Type      | Description                                           |
| -------------------- | --------- | ----------------------------------------------------- |
| `constructor(props)` | public    | `{ aggregateId, occurredAt, payload }`.               |
| `type`               | `string`  | The class name.                                       |
| `aggregateId`        | `Id`      | The aggregate the event belongs to.                   |
| `occurredAt`         | `Date`    | When it happened. The event keeps its own copy.       |
| `payload`            | `Payload` | The data of the event.                                |

**Caveats**

- `type` comes from the class name. Keep class names when you bundle or minify your code, for
  example with `keepNames` in esbuild.

Import from `@alveolus/core` or `@alveolus/core/domain-events`.

## Troubleshooting

### The event type is a short name like `a` in production

Your bundler renamed the class. Enable `keepNames` (esbuild) or the equivalent option of your
bundler.

## See also

- [Aggregates](./aggregates.md), which record events
- [Domain event rules](/arch/rules/domain-events), checked by `alveolus arch check`
- [Event assertions](/testing/event-assertions) and [Scenarios](/testing/scenarios), to test them
- [Project layout](/arch/project-layout), where they live
