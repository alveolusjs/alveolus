# Event publishers

An event publisher is the port that sends [integration events](./integration-events.md) to the rest
of the world: a message broker, a webhook, the other contexts of the same process. The
[outbox relay](./outbox.md) calls it; command handlers never do.

```ts
export class KafkaEventPublisher extends EventPublisher {
	async publish(events: readonly AnyIntegrationEvent[]): Promise<void> {
		await this.producer.send({ messages: events.map((event) => ({ key: event.id, value: JSON.stringify(event) })), topic: "ordering" });
	}
}
```

## When to use

Implement one as soon as integration events must reach something outside the transaction that
produced them. It is the last step of the outbox: the relay reads pending events and hands them to
the publisher.

## Usage

### Implement it in a driven adapter

Extend `EventPublisher` under the name of the technology. Publish the events in order and throw when
it fails: the relay then keeps them pending and retries.

```ts [src/shared-kernel/driven/kafka/adapters/kafka-event-publisher.adapter.ts]
import { type AnyIntegrationEvent, EventPublisher } from "@alveolus/core";
import type { Producer } from "kafkajs";

export class KafkaEventPublisher extends EventPublisher {
	constructor(private readonly producer: Producer) {
		super();
	}

	async publish(events: readonly AnyIntegrationEvent[]): Promise<void> {
		for (const event of events) {
			await this.producer.send({ messages: [{ key: event.id, value: JSON.stringify(event) }], topic: `${event.source}.${event.type}` });
		}
	}
}
```

### Publish in the same process

In a modular monolith, the publisher can call the consumers of the other contexts directly. Each
consumer is a driving adapter of its context and translates the event in its own words.

```ts [src/shared-kernel/driven/memory/adapters/in-process-event-publisher.adapter.ts]
import { type AnyIntegrationEvent, EventPublisher } from "@alveolus/core";

export class InProcessEventPublisher extends EventPublisher {
	constructor(private readonly consumers: readonly { consume(event: AnyIntegrationEvent): Promise<unknown> }[]) {
		super();
	}

	async publish(events: readonly AnyIntegrationEvent[]): Promise<void> {
		for (const event of events) {
			for (const consumer of this.consumers) {
				await consumer.consume(event);
			}
		}
	}
}
```

### Do not publish from the command handler

Publishing right after saving loses the event if the process stops in between. Add the events to the
outbox in the same transaction and let the relay publish them.

<div class="al-compare">

```ts [❌ Avoid: in a command handler]
await this.orders.save(order);
await this.publisher.publish(events);
```

```ts [✅ Prefer: in a command handler]
await this.unitOfWork.run(async () => {
	await this.orders.save(order);
	await this.outbox.add(events);
	return ok();
});
```

</div>

## Reference

```ts
abstract class EventPublisher extends Port {
	abstract publish(events: readonly AnyIntegrationEvent[]): Promise<void>;
}
```

| Member | Type | Description |
| --- | --- | --- |
| `publish(events)` | `Promise<void>` | Publishes the integration events, in order. Throws on failure. |

**Caveats**

- A failure to publish is technical: the adapter throws instead of returning a `Result`.
- Delivery is at least once: an event may be published twice. Consumers ignore duplicates by `id`.
- `EventPublisher` extends `Port`: it is an injection token, and its adapters live in
  `driven/<technology>/adapters/` (see [`driven-adapters-extend-port`](../../rules/driven-adapters-extend-port.md)).

Import from `@alveolus/core` or `@alveolus/core/event-publishers`.

## See also

- [Outbox](./outbox.md), whose relay calls the publisher
- [Integration events](./integration-events.md), what is published
- [Ports](../domain/ports.md)
