---
description: "The transactional outbox pattern in TypeScript: store integration events in the same transaction as the change, then relay them so none is lost."
---

# Outbox

An outbox stores the integration events of a change in the same transaction as the change, then a
relay publishes them, so none is lost.

<dl class="al-glance">
	<dt>Layer</dt><dd>Application (a port, and the <code>OutboxRelay</code> class)</dd>
	<dt>File</dt><dd><code>shared-kernel/driven/pg/adapters/pg-outbox.adapter.ts</code> (your adapter)</dd>
	<dt>Extends</dt><dd><a href="#api"><code>Outbox</code></a></dd>
	<dt>Called by</dt><dd><a href="/core/application/command-handlers">Command handlers</a> (<code>add</code>), <code>OutboxRelay</code> (<code>pending</code>, <code>markPublished</code>)</dd>
	<dt>Checked by</dt><dd><a href="/rules/layers/no-portless-adapter"><code>layers/no-portless-adapter</code></a>, <a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></dd>
</dl>

## Why

When an order is placed, shipping and billing must hear about it. If the handler saves the order
then publishes `OrderPlaced` to the broker, two things go wrong. The process stops between the two:
the order is placed and nobody hears about it. The broker is down: the command fails although the
order is valid.

::: tip The fix
The handler adds the events to the outbox, in the same [unit of work](./unit-of-work.md) as the
order: both are saved, or neither. Later, the `OutboxRelay` reads the pending events and hands them
to the [event publisher](./event-publishers.md), retrying until it succeeds.
:::

## How it works

The outbox splits publishing in two moments: storing, in the transaction of the change, and
relaying, in the background.

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
	<text class="label" x="158" y="70" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="158" y="87" text-anchor="middle">places the order</text>
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

Each call to `relay()` does three things:

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Read a batch</span><code>outbox.pending(n)</code> returns up to <code>n</code> unpublished events, oldest first.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Publish it</span><code>publisher.publish(events)</code> sends them. If it throws, the events stay pending for the next call.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Mark it</span><code>outbox.markPublished(ids)</code> records that they left. The next call skips them.</div>
</div>

## Where it fits

In the PlaceOrder flow, the outbox is the last step of the command handler, inside its unit of work.

<div class="al-diagram">
<svg viewBox="0 0 680 300" role="img" aria-label="A request goes from a controller to the PlaceOrderHandler, which in one unit of work loads the Order from the repository, calls order.place, saves the order and adds its events to the outbox.">
	<defs>
		<marker id="outbox-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="122" width="130" height="56" rx="8" />
	<text class="label" x="73" y="146" text-anchor="middle">Controller</text>
	<text class="note" x="73" y="166" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 150 L 178 150" marker-end="url(#outbox-flow-arrow)" />
	<rect class="box" x="180" y="122" width="180" height="56" rx="8" />
	<text class="label" x="270" y="146" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="270" y="166" text-anchor="middle">command handler</text>
	<text class="note" x="270" y="204" text-anchor="middle">one unit of work</text>
	<rect class="box" x="440" y="24" width="232" height="48" rx="8" />
	<text class="label" x="556" y="44" text-anchor="middle">1 · orders.findById(id)</text>
	<text class="note" x="556" y="62" text-anchor="middle">loads the Order</text>
	<rect class="box" x="440" y="92" width="232" height="48" rx="8" />
	<text class="label" x="556" y="112" text-anchor="middle">2 · order.place(…)</text>
	<text class="note" x="556" y="130" text-anchor="middle">rules + event</text>
	<rect class="box" x="440" y="160" width="232" height="48" rx="8" />
	<text class="label" x="556" y="180" text-anchor="middle">3 · orders.save(order)</text>
	<text class="note" x="556" y="198" text-anchor="middle">stores its snapshot</text>
	<rect class="boundary" x="440" y="228" width="232" height="48" rx="8" />
	<text class="label" x="556" y="248" text-anchor="middle">4 · outbox.add(events)</text>
	<text class="note" x="556" y="266" text-anchor="middle">this page: stored, not sent</text>
	<path class="link" d="M 360 150 L 438 48" marker-end="url(#outbox-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 116" marker-end="url(#outbox-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 184" marker-end="url(#outbox-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 252" marker-end="url(#outbox-flow-arrow)" />
</svg>
</div>

The domain events are first turned into integration events by an
[event translator](./event-translators.md): the outbox stores JSON, never domain classes.

::: tip
A command handler never publishes. It stores; the relay publishes.
:::

## API

```ts
import { Outbox, OutboxRelay } from "@alveolus/core";
// or: import { Outbox, OutboxRelay } from "@alveolus/core/outbox";
```

`Outbox` is the port you implement; `OutboxRelay` is a class provided by core that moves its
events to the [event publisher](./event-publishers.md).

### `add(events)` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" /> <Badge type="tip" text="called by the command handler" />

```ts
abstract add(events: readonly AnyIntegrationEvent[]): Promise<void>
```

Stores the events of the change, in the current transaction.

### `pending(limit)` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" /> <Badge type="tip" text="called by the OutboxRelay" />

```ts
abstract pending(
	limit: number,
): Promise<readonly AnyIntegrationEvent[]>
```

Returns up to `limit` unpublished events, oldest first.

### `markPublished(ids)` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" /> <Badge type="tip" text="called by the OutboxRelay" />

```ts
abstract markPublished(ids: readonly string[]): Promise<void>
```

Marks the events with these ids as published.

### `new OutboxRelay(outbox, publisher, batchSize?)` <Badge type="tip" text="called by the composition root" />

```ts
constructor(
	outbox: Outbox,
	publisher: EventPublisher,
	batchSize: number = 100,
)
```

Builds the relay from the outbox to the publisher. `batchSize` is how many events one call to
`relay` reads.

### `relay()` <Badge type="tip" text="called by a timer, a cron job or a worker" />

```ts
relay(): Promise<number>
```

Reads one batch from `pending`, publishes it in one call, marks it published, and returns how many
events it published: `0` when none is pending.

::: warning Caveats
- Delivery is at least once: if the relay stops between publishing and marking, the events are
  published again. Consumers ignore duplicates by `id`.
- Several relays running at once may publish the same batch. Lock the rows in `pending` (for
  instance `FOR UPDATE SKIP LOCKED`) if you run more than one.
- `relay()` publishes one batch per call. Call it on a schedule, not once.
:::

## Usage

Build an outbox in PostgreSQL. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-share-the-transaction">Share the transaction</a></span>Write where the order is saved.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-adapter">Declare the adapter</a></span>Extend the port.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-add-inside-the-transaction">Add inside the transaction</a></span>Saved with the order, or not at all.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-read-what-is-pending">Read what is pending</a></span>Oldest first, a batch at a time.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-mark-them-published">Mark them published</a></span>Never sent twice on purpose.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-run-the-relay">Run the relay</a></span>On a schedule, in a driving adapter.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">7</span><a href="#_7-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Share the transaction

The outbox writes in the transaction of the [unit of work](./unit-of-work.md#usage), which shares its connection through an `AsyncLocalStorage`: build that first.

### 2. Declare the adapter

The adapter extends `Outbox` and receives the pool, for the relay, and the storage of the current connection, for the handler.

```ts [src/shared-kernel/driven/pg/adapters/pg-outbox.adapter.ts]
import type { AsyncLocalStorage } from "node:async_hooks";

import { type AnyIntegrationEvent, Outbox } from "@alveolus/core";
import type { Pool, PoolClient } from "pg";

export class PgOutbox extends Outbox {
	constructor(
		private readonly pool: Pool,
		private readonly current: AsyncLocalStorage<PoolClient>,
	) {
		super();
	}
}
```

TypeScript now asks for `add`, `pending` and `markPublished`: the next steps add them.

### 3. Add inside the transaction

So that an event is never stored for an order that was not saved, `add` writes through the connection of the current unit of work, and refuses to run outside one. Each event is stored as it is, in a `jsonb` column.

```ts [src/shared-kernel/driven/pg/adapters/pg-outbox.adapter.ts]
import type { AsyncLocalStorage } from "node:async_hooks";

import { type AnyIntegrationEvent, Outbox } from "@alveolus/core";
import type { Pool, PoolClient } from "pg";

export class PgOutbox extends Outbox {
	constructor(
		private readonly pool: Pool,
		private readonly current: AsyncLocalStorage<PoolClient>,
	) {
		super();
	}

	async add(events: readonly AnyIntegrationEvent[]): Promise<void> { // [!code ++]
		const client = this.current.getStore(); // [!code ++]
		if (client === undefined) { // [!code ++]
			throw new Error("PgOutbox.add runs inside a unit of work."); // [!code ++]
		} // [!code ++]
		for (const event of events) { // [!code ++]
			await client.query( // [!code ++]
				"INSERT INTO outbox (id, event) VALUES ($1, $2)", // [!code ++]
				[event.id, event], // [!code ++]
			); // [!code ++]
		} // [!code ++]
	} // [!code ++]
}
```

### 4. Read what is pending

The relay reads the events not yet published, in the order they were added, through the pool: it runs outside any transaction.

```ts [src/shared-kernel/driven/pg/adapters/pg-outbox.adapter.ts]
import type { AsyncLocalStorage } from "node:async_hooks";

import { type AnyIntegrationEvent, Outbox } from "@alveolus/core";
import type { Pool, PoolClient } from "pg";

export class PgOutbox extends Outbox {
	constructor(
		private readonly pool: Pool,
		private readonly current: AsyncLocalStorage<PoolClient>,
	) {
		super();
	}

	async add(events: readonly AnyIntegrationEvent[]): Promise<void> {
		const client = this.current.getStore();
		if (client === undefined) {
			throw new Error("PgOutbox.add runs inside a unit of work.");
		}
		for (const event of events) {
			await client.query(
				"INSERT INTO outbox (id, event) VALUES ($1, $2)",
				[event.id, event],
			);
		}
	}

	async pending( // [!code ++]
		limit: number, // [!code ++]
	): Promise<readonly AnyIntegrationEvent[]> { // [!code ++]
		const { rows } = await this.pool.query( // [!code ++]
			`SELECT event FROM outbox // [!code ++]
			 WHERE published_at IS NULL // [!code ++]
			 ORDER BY created_at // [!code ++]
			 LIMIT $1`, // [!code ++]
			[limit], // [!code ++]
		); // [!code ++]
		return rows.map((row) => row.event); // [!code ++]
	} // [!code ++]
}
```

### 5. Mark them published

Once the publisher has sent a batch, the relay marks it published, so the next run skips it.

```ts [src/shared-kernel/driven/pg/adapters/pg-outbox.adapter.ts]
import type { AsyncLocalStorage } from "node:async_hooks";

import { type AnyIntegrationEvent, Outbox } from "@alveolus/core";
import type { Pool, PoolClient } from "pg";

export class PgOutbox extends Outbox {
	constructor(
		private readonly pool: Pool,
		private readonly current: AsyncLocalStorage<PoolClient>,
	) {
		super();
	}

	async add(events: readonly AnyIntegrationEvent[]): Promise<void> {
		const client = this.current.getStore();
		if (client === undefined) {
			throw new Error("PgOutbox.add runs inside a unit of work.");
		}
		for (const event of events) {
			await client.query(
				"INSERT INTO outbox (id, event) VALUES ($1, $2)",
				[event.id, event],
			);
		}
	}

	async pending(
		limit: number,
	): Promise<readonly AnyIntegrationEvent[]> {
		const { rows } = await this.pool.query(
			`SELECT event FROM outbox
			 WHERE published_at IS NULL
			 ORDER BY created_at
			 LIMIT $1`,
			[limit],
		);
		return rows.map((row) => row.event);
	}

	async markPublished(ids: readonly string[]): Promise<void> { // [!code ++]
		await this.pool.query( // [!code ++]
			"UPDATE outbox SET published_at = now() WHERE id = ANY($1)", // [!code ++]
			[ids], // [!code ++]
		); // [!code ++]
	} // [!code ++]
}
```

This is the complete outbox.

### 6. Run the relay

The composition root builds the relay, `new OutboxRelay(outbox, publisher, 100)`, and a driving adapter runs it on a schedule. A failure is logged: the events stay pending for the next tick.

```ts [src/ordering/driving/timer/jobs/outbox-relay.job.ts]
import type { OutboxRelay } from "@alveolus/core";

export class OutboxRelayJob {
	constructor(private readonly relay: OutboxRelay) {}

	start(): NodeJS.Timeout {
		return setInterval(() => this.tick(), 1000);
	}

	private async tick(): Promise<void> {
		try {
			await this.relay.relay();
		} catch (error) {
			console.error("Relay failed; events stay pending.", error);
		}
	}
}
```

### 7. Check it

Run the checks. Two rules keep the outbox the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-portless-adapter"><code>no-portless-adapter</code></a></span>It extends the port it implements.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>driven/pg/adapters/*.adapter.ts</code>.</div>
</div>

The same class without <code>extends Outbox</code> is reported:

```
src/shared-kernel/driven/pg/adapters/pg-outbox.adapter.ts
  6  layers/no-portless-adapter: PgOutbox is a driven adapter
  but extends no Port: extend the port it implements.
```

## See also

- [Unit of Work](./unit-of-work.md), the transaction the outbox is written in
- [Event translators](./event-translators.md), which build what the outbox stores
- [Integration events](./integration-events.md), what it stores
- [Event publishers](./event-publishers.md), what the relay calls
- Rules: [`layers/no-portless-adapter`](../../rules/layers/no-portless-adapter.md)
