# Event publishers

An event publisher is the port that sends the [domain events](../domain/domain-events.md) of an
aggregate to the rest of the system once the aggregate is saved. The application calls it; a driven
adapter implements it.

```ts
await orders.save(order);
await publisher.publish(order.pullDomainEvents());
```

## When to use

Call the publisher in every [command handler](./command-handlers.md) that saves an aggregate.
Aggregates only record events; [repositories](../domain/repositories.md) leave them on the
aggregate. Publishing is the handler's job.

## Usage

### Publish after saving

Save first, then pull the events: `pullDomainEvents()` returns them in the order they were recorded
and clears them, so they are published once.

```ts
await this.orders.save(order);
await this.publisher.publish(order.pullDomainEvents());
```

If the publish fails after the save, the change is stored but the events are lost. When that
matters, implement the publisher with an outbox: write the events in the same transaction as the
aggregate and send them from there.

### Implement it

The adapter lives in `driven/`. It can call subscribers in the same process, write to an outbox
table or send to a message broker.

```ts [src/ordering/driven/in-process-event-publisher.ts]
import type { AnyDomainEvent, EventPublisher } from "@alveolus/core";

export class InProcessEventPublisher implements EventPublisher {
	constructor(private readonly subscribers: readonly ((event: AnyDomainEvent) => Promise<void>)[]) {}

	async publish(events: readonly AnyDomainEvent[]): Promise<void> {
		for (const event of events) {
			await Promise.all(this.subscribers.map((subscriber) => subscriber(event)));
		}
	}
}
```

Subscribers can narrow an event with `instanceof` or its `type`.

## Reference

```ts
interface EventPublisher
```

| Member            | Type            | Description                                   |
| ----------------- | --------------- | --------------------------------------------- |
| `publish(events)` | `Promise<void>` | Publishes the events, in order. Throws on failure. |

**Caveats**

- A failure to publish is technical: the adapter throws instead of returning a `Result`.
- `publish([])` is valid: an operation may record no event.

Import from `@alveolus/core` or `@alveolus/core/event-publishers`.

## See also

- [Domain Events](../domain/domain-events.md), what is published
- [Aggregates](../domain/aggregates.md#publish-recorded-events), where events are recorded
- [Event assertions](/testing/event-assertions), to check recorded events in tests
