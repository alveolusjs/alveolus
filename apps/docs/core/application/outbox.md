# Outbox

An outbox stores the [integration events](./integration-events.md) of a change in the same
transaction as the change itself. A relay then reads them and hands them to an
[event publisher](./event-publishers.md), retrying until it succeeds: an event is never lost, even if
the broker is down when the change is saved.

```ts
await this.outbox.add(order.pullDomainEvents().map((event) => this.translator.translate(event, { correlationId })));

await new OutboxRelay(outbox, publisher).relay();
```

<div class="al-diagram">
<svg viewBox="0 0 700 250" role="img" aria-label="Inside one unit of work, the command handler saves the aggregate and adds its integration events to the outbox. Later, the outbox relay reads pending events, calls the event publisher, which sends them to other contexts, then marks them as published.">
	<defs>
		<marker id="outbox-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="8" width="300" height="234" rx="14" />
	<text class="note" x="24" y="32">one unit of work</text>
	<rect class="box" x="28" y="48" width="260" height="48" rx="8" />
	<text class="label" x="158" y="70" text-anchor="middle">command handler</text>
	<text class="note" x="158" y="87" text-anchor="middle">place the order</text>
	<rect class="box" x="28" y="150" width="120" height="70" rx="8" />
	<text class="label" x="88" y="180" text-anchor="middle">orders</text>
	<text class="note" x="88" y="200" text-anchor="middle">save(order)</text>
	<rect class="box" x="168" y="150" width="120" height="70" rx="8" />
	<text class="label" x="228" y="180" text-anchor="middle">outbox</text>
	<text class="note" x="228" y="200" text-anchor="middle">add(events)</text>
	<path class="link" d="M 88 96 L 88 148" marker-end="url(#outbox-arrow)" />
	<path class="link" d="M 228 96 L 228 148" marker-end="url(#outbox-arrow)" />
	<rect class="box" x="372" y="150" width="140" height="70" rx="8" />
	<text class="label" x="442" y="180" text-anchor="middle">OutboxRelay</text>
	<text class="note" x="442" y="200" text-anchor="middle">relay()</text>
	<path class="link" d="M 370 185 L 290 185" marker-end="url(#outbox-arrow)" />
	<text class="note" x="340" y="176" text-anchor="middle">pending</text>
	<rect class="box" x="372" y="48" width="140" height="48" rx="8" />
	<text class="label" x="442" y="70" text-anchor="middle">EventPublisher</text>
	<text class="note" x="442" y="87" text-anchor="middle">publish(events)</text>
	<path class="link" d="M 442 150 L 442 98" marker-end="url(#outbox-arrow)" />
	<rect class="box" x="546" y="48" width="146" height="48" rx="8" />
	<text class="label" x="619" y="70" text-anchor="middle">other contexts</text>
	<text class="note" x="619" y="87" text-anchor="middle">broker, consumers</text>
	<path class="link" d="M 512 72 L 544 72" marker-end="url(#outbox-arrow)" />
</svg>
</div>

## When to use

Whenever an event must not be lost: other bounded contexts, other systems or an audit trail depend
on it. Add the events in the [unit of work](./unit-of-work.md) of the change, and run the relay in
the background.

## Usage

### Add the events of a change

In the [command handler](./command-handlers.md), inside the unit of work, after saving the
aggregate, translated by an [event translator](./event-translators.md).

```ts [src/ordering/application/commands/place-order.command.ts]
return this.unitOfWork.run(async () => {
	await this.orders.save(order);
	await this.outbox.add(order.pullDomainEvents().map((event) => this.translator.translate(event, { correlationId: orderId })));
	return ok();
});
```

### Relay the events

`OutboxRelay` reads a batch of pending events, publishes them and marks them as published. It returns
how many it published; if publishing fails, it throws and the events stay pending for the next call.
With NestJS, build it with a factory and call it from a scheduled job, a driving adapter.

```ts [src/ordering/ordering.module.ts]
{
	inject: [Outbox, EventPublisher],
	provide: OutboxRelay,
	useFactory: (outbox: Outbox, publisher: EventPublisher) => new OutboxRelay(outbox, publisher, 100),
}
```

```ts [src/ordering/driving/nestjs/jobs/outbox-relay.job.ts]
import { OutboxRelay } from "@alveolus/core";
import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";

@Injectable()
export class OutboxRelayJob {
	constructor(private readonly relay: OutboxRelay) {}

	@Interval(1000)
	async run(): Promise<void> {
		await this.relay.relay();
	}
}
```

### Implement it

Extend `Outbox` in a driven adapter, typically over a table written through the transaction of the
unit of work. Integration events are JSON: store them as they are, for instance in a `jsonb` column,
and return them unchanged from `pending`, oldest first.

```ts [src/shared-kernel/driven/pg/adapters/pg-outbox.adapter.ts]
import { type AnyIntegrationEvent, Outbox } from "@alveolus/core";
import type { Pool } from "pg";

export class PgOutbox extends Outbox {
	constructor(private readonly db: Pool) {
		super();
	}

	async add(events: readonly AnyIntegrationEvent[]): Promise<void> {
		for (const event of events) {
			await this.db.query("INSERT INTO outbox (id, event) VALUES ($1, $2)", [event.id, event]);
		}
	}

	async pending(limit: number): Promise<readonly AnyIntegrationEvent[]> {
		const { rows } = await this.db.query("SELECT event FROM outbox WHERE published_at IS NULL ORDER BY created_at LIMIT $1", [limit]);
		return rows.map((row) => row.event);
	}

	async markPublished(ids: readonly string[]): Promise<void> {
		await this.db.query("UPDATE outbox SET published_at = now() WHERE id = ANY($1)", [ids]);
	}
}
```

### Do not publish directly

<div class="al-compare">

```ts [❌ Avoid]
await this.orders.save(order);
await this.publisher.publish(events);
```

```ts [✅ Prefer]
await this.unitOfWork.run(async () => {
	await this.orders.save(order);
	await this.outbox.add(events);
	return ok();
});
```

</div>

::: details Why?
If the process stops between `save` and `publish`, the order is placed and nobody hears about it. If
the broker is down, the command fails although the order is valid. Writing the events in the same
transaction as the change, then relaying them, removes both cases.
:::

## Reference

```ts
abstract class Outbox extends Port {
	abstract add(events: readonly AnyIntegrationEvent[]): Promise<void>;
	abstract pending(limit: number): Promise<readonly AnyIntegrationEvent[]>;
	abstract markPublished(ids: readonly string[]): Promise<void>;
}

class OutboxRelay {
	constructor(outbox: Outbox, publisher: EventPublisher, batchSize?: number);
	relay(): Promise<number>;
}
```

| Member | Type | Description |
| --- | --- | --- |
| `add(events)` | `Promise<void>` | Stores the events, in the current transaction. |
| `pending(limit)` | `Promise<readonly AnyIntegrationEvent[]>` | Returns up to `limit` unpublished events, oldest first. |
| `markPublished(ids)` | `Promise<void>` | Marks the events as published. |
| `new OutboxRelay(outbox, publisher, batchSize = 100)` | | Relays from the outbox to the publisher. |
| `relay()` | `Promise<number>` | Publishes one batch and returns how many events it published; `0` when none is pending. |

**Caveats**

- Delivery is at least once: if the relay stops between publishing and marking, the events are
  published again. Consumers ignore duplicates by `id`.
- Several relays running at once may publish the same batch; lock the rows in `pending` (for
  instance `FOR UPDATE SKIP LOCKED`) if you run more than one.

Import from `@alveolus/core` or `@alveolus/core/outbox`.

## See also

- [Unit of Work](./unit-of-work.md), the transaction the outbox is written in
- [Event translators](./event-translators.md), which build what the outbox stores
- [Event publishers](./event-publishers.md), what the relay calls
