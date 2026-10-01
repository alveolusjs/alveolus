# Notifications

A notification carries a [domain event](../domain/domain-events.md) outside its bounded context. It
wraps the event with an identifier and a format version, and serializes to JSON so that other
bounded contexts read it without depending on your classes.

```ts
const notification = new Notification({ id: randomUUID(), event, metadata: {} });
await notificationPublisher.publish([notification]);
```

## When to use

Publish notifications when another bounded context, or another service, needs to react to what
happened in yours. Inside the bounded context, publish domain events with an
[event publisher](./event-publishers.md).

## Usage

### Wrap the events to share

After saving the aggregate, wrap the events other bounded contexts need. `type` and `occurredAt`
come from the event; `id` lets consumers ignore a notification they receive twice.

```ts
import { randomUUID } from "node:crypto";
import { Notification } from "@alveolus/core";

await this.orders.save(order);
const events = order.pullDomainEvents();
await this.publisher.publish(events);
await this.notificationPublisher.publish(
	events
		.filter((event) => event instanceof OrderPlaced)
		.map((event) => new Notification({ id: randomUUID(), event, metadata: {} })),
);
```

As with [event publishers](./event-publishers.md#publish-after-saving), use an outbox when
notifications must not be lost if the publish fails after the save.

### Add metadata

`metadata` carries what the domain event does not know, such as who triggered it, through which
channel, or a correlation id: what an audit trail needs, next to the what (`event`) and the when
(`occurredAt`). It is always passed: use `metadata: {}` when there is nothing to add.

```ts [src/ordering/application/metadata/audit.metadata.ts]
export interface Audit {
	readonly userId: string;
	readonly channel: "api" | "backoffice";
	readonly correlationId: string;
}
```

```ts
await this.notificationPublisher.publish(
	events.map((event) => new Notification({ id: randomUUID(), event, metadata: audit })),
);
```

The command handler receives the audit data with the command, from the driving adapter that knows
the user and the channel. With `NotificationPublisher<Audit>`, metadata of another shape does not
compile, and the adapter reads `notification.metadata.userId` with its type.

### Version the event format

Once published, the payload of an event is a contract with its consumers. When it changes in a way
they must know about, increase `version` so that they can read both formats while they migrate.

```ts
new Notification({ id: randomUUID(), event, metadata: {}, version: 2 });
```

### Implement the publisher

The adapter lives in `driven/`. It can send to a message broker, append to a notification log or
write to an outbox table.

```ts [src/ordering/driven/broker-notification-publisher.ts]
import type { AnyDomainEvent, Notification, NotificationPublisher } from "@alveolus/core";
import type { Audit } from "../application/metadata/audit.metadata.ts";

export class BrokerNotificationPublisher implements NotificationPublisher<Audit> {
	constructor(private readonly send: (topic: string, message: string) => Promise<void>) {}

	async publish(notifications: readonly Notification<AnyDomainEvent, Audit>[]): Promise<void> {
		for (const notification of notifications) {
			await this.send(notification.type, JSON.stringify(notification));
		}
	}
}
```

```json
{
	"id": "1f0c…",
	"type": "OrderPlaced",
	"version": 1,
	"occurredAt": "2026-01-01T00:00:00.000Z",
	"event": {
		"aggregateId": "ord_1",
		"occurredAt": "2026-01-01T00:00:00.000Z",
		"payload": { "total": 42 }
	},
	"metadata": { "userId": "usr_7", "channel": "api", "correlationId": "c0a8…" }
}
```

Consumers read the fields they need from this JSON and translate them into their own model; they
never import the event class.

## Reference

```ts
class Notification<Event extends AnyDomainEvent = AnyDomainEvent, Metadata extends object = object>

interface NotificationPublisher<Metadata extends object = object>
```

| Type parameter | Description                                |
| -------------- | ------------------------------------------ |
| `Event`        | The domain event carried by the notification. |
| `Metadata`     | Data added by the application, such as audit data: an object, inferred from `metadata`. |

| Member               | Type     | Description                                                     |
| -------------------- | -------- | --------------------------------------------------------------- |
| `constructor(props)` | public   | `{ id, event, metadata, version? }`. |
| `id`                 | `string` | Identifies the notification, so consumers can ignore duplicates. |
| `type`               | `string` | The `type` of the event: its class name.                         |
| `version`            | `number` | Version of the event format, `1` by default.                    |
| `occurredAt`         | `Date`   | When the event happened; a copy of the event date.              |
| `event`              | `Event`  | The domain event.                                               |
| `metadata`           | `Metadata` | Data added by the application; `{}` when there is nothing to add. |

| `NotificationPublisher` member | Type            | Description                                               |
| ------------------------------ | --------------- | --------------------------------------------------------- |
| `publish(notifications)`       | `Promise<void>` | Publishes the notifications, in order. Throws on failure. |

**Caveats**

- `AnyNotification` is a notification with any event and any metadata.
- A `version` that is not a positive integer throws a `RangeError`.
- `type` is the class name of the event. Keep class names when you bundle or minify your code, and
  do not rename a published event: consumers rely on its name.
- Identifiers serialize to their value; a value object serializes as `{ "props": … }` unless it
  defines `toJSON`. Check the JSON you publish.

Import from `@alveolus/core` or `@alveolus/core/notifications`.

## See also

- [Domain Events](../domain/domain-events.md), what a notification carries
- [Event publishers](./event-publishers.md), to publish domain events inside the bounded context
- [Command handlers](./command-handlers.md), where notifications are published
