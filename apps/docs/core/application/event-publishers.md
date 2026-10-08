---
description: "Event publishers in TypeScript: the port that sends integration events to a message broker such as Kafka, a webhook, or other bounded contexts."
---

# Event publishers

An event publisher is the port that sends [integration events](./integration-events.md) out of the
bounded context: to a broker, a webhook, or the other contexts of the same process.

<dl class="al-glance">
	<dt>Layer</dt><dd>Application (a port)</dd>
	<dt>File</dt><dd><code>shared-kernel/driven/kafka/adapters/kafka-event-publisher.adapter.ts</code> (your adapter)</dd>
	<dt>Extends</dt><dd><a href="#api"><code>EventPublisher</code></a></dd>
	<dt>Called by</dt><dd>The <a href="/core/application/outbox"><code>OutboxRelay</code></a>, never a command handler</dd>
	<dt>Checked by</dt><dd><a href="/rules/layers/no-portless-adapter"><code>layers/no-portless-adapter</code></a>, <a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></dd>
</dl>

## Why

Shipping must learn that an order was placed. The ordering context should not know whether that
goes through Kafka, RabbitMQ or a function call: if the relay used the Kafka client directly,
changing the broker, or testing without one, would mean changing application code.

::: tip The fix
The application talks to an abstract `EventPublisher` with one method, `publish(events)`. A driven
adapter implements it with the technology you use. The [outbox relay](./outbox.md) calls it; nothing
else does.
:::

## How it works

`publish` receives a batch of integration events, already JSON, and must either send them all or
throw.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Send in order</span>Publish the events in the order received: <code>OrderPlaced</code> before a later <code>OrderCancelled</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Throw on failure</span>A broker down is technical: throw. The relay keeps the events pending and retries.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Expect duplicates</span>Delivery is at least once. Consumers ignore an event whose <code>id</code> they already handled.</div>
</div>

## Where it fits

The publisher is the second step of the outbox relay, run in the background after the order was
saved.

<div class="al-diagram">
<svg viewBox="0 0 680 240" role="img" aria-label="A timer job calls the OutboxRelay, which reads pending events from the outbox, calls the event publisher, and marks the events as published.">
	<defs>
		<marker id="publisher-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="92" width="130" height="56" rx="8" />
	<text class="label" x="73" y="116" text-anchor="middle">Timer job</text>
	<text class="note" x="73" y="136" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 120 L 178 120" marker-end="url(#publisher-flow-arrow)" />
	<rect class="box" x="180" y="92" width="180" height="56" rx="8" />
	<text class="label" x="270" y="116" text-anchor="middle">OutboxRelay</text>
	<text class="note" x="270" y="136" text-anchor="middle">relay()</text>
	<rect class="box" x="440" y="24" width="232" height="48" rx="8" />
	<text class="label" x="556" y="44" text-anchor="middle">1 · outbox.pending(n)</text>
	<text class="note" x="556" y="62" text-anchor="middle">reads a batch</text>
	<rect class="boundary" x="440" y="96" width="232" height="48" rx="8" />
	<text class="label" x="556" y="116" text-anchor="middle">2 · publisher.publish(events)</text>
	<text class="note" x="556" y="134" text-anchor="middle">this page: sends them</text>
	<rect class="box" x="440" y="168" width="232" height="48" rx="8" />
	<text class="label" x="556" y="188" text-anchor="middle">3 · outbox.markPublished(ids)</text>
	<text class="note" x="556" y="206" text-anchor="middle">skips them next time</text>
	<path class="link" d="M 360 120 L 438 48" marker-end="url(#publisher-flow-arrow)" />
	<path class="link" d="M 360 120 L 438 120" marker-end="url(#publisher-flow-arrow)" />
	<path class="link" d="M 360 120 L 438 192" marker-end="url(#publisher-flow-arrow)" />
</svg>
</div>

::: tip
If `publish` throws, step 3 never runs: the same events are published on the next call.
:::

## API

```ts
import { EventPublisher } from "@alveolus/core";
// or: import { EventPublisher } from "@alveolus/core/event-publishers";
```

### `publish(events)` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" /> <Badge type="tip" text="called by the OutboxRelay" />

```ts
abstract publish(
	events: readonly AnyIntegrationEvent[],
): Promise<void>
```

Sends the integration events, in order, and throws on failure. The `OutboxRelay` calls it with one
batch of pending events.

::: warning Caveats
- A failure to publish is technical: the adapter throws instead of returning a `Result`.
- Delivery is at least once: an event may be published twice. Consumers ignore duplicates by `id`.
- `EventPublisher` extends `Port`: it is an injection token, and its adapters live in
  `driven/<technology>/adapters/`.
:::

## Usage

Build a publisher for Kafka. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-pick-the-broker">Pick the broker</a></span>One adapter per technology.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-adapter">Declare the adapter</a></span>Extend the port.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-publish-each-event">Publish each event</a></span>In order, one topic per event type.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-key-each-message-by-its-id">Key each message by its id</a></span>Let consumers ignore duplicates.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-wire-it-to-the-relay">Wire it to the relay</a></span>Only the relay calls it.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Pick the broker

`EventPublisher` is a port of `@alveolus/core`: you only write its adapter, under the name of its technology, here `driven/kafka/adapters/`, in the shared kernel.

### 2. Declare the adapter

The adapter extends `EventPublisher` and receives the client of the broker in its constructor, built by the composition root.

```ts [src/shared-kernel/driven/kafka/adapters/kafka-event-publisher.adapter.ts]
import { EventPublisher } from "@alveolus/core";
import type { Producer } from "kafkajs";

export class KafkaEventPublisher extends EventPublisher {
	constructor(private readonly producer: Producer) {
		super();
	}
}
```

TypeScript now asks for `publish()`: the next step adds it.

### 3. Publish each event

The relay hands over a batch in the order the events were added. Sending them one by one keeps that order, and a failure throws: the events stay pending in the outbox and are sent again.

```ts [src/shared-kernel/driven/kafka/adapters/kafka-event-publisher.adapter.ts]
import { EventPublisher } from "@alveolus/core"; // [!code --]
import { type AnyIntegrationEvent, EventPublisher } from "@alveolus/core"; // [!code ++]
import type { Producer } from "kafkajs";

export class KafkaEventPublisher extends EventPublisher {
	constructor(private readonly producer: Producer) {
		super();
	}

	async publish( // [!code ++]
		events: readonly AnyIntegrationEvent[], // [!code ++]
	): Promise<void> { // [!code ++]
		for (const event of events) { // [!code ++]
			await this.producer.send({ // [!code ++]
				messages: [{ value: JSON.stringify(event) }], // [!code ++]
				topic: `${event.source}.${event.type}`, // [!code ++]
			}); // [!code ++]
		} // [!code ++]
	} // [!code ++]
}
```

### 4. Key each message by its id

An event may be sent twice, after a failure between sending and marking it published. Its id, as the message key, lets consumers recognise and ignore a duplicate.

```ts [src/shared-kernel/driven/kafka/adapters/kafka-event-publisher.adapter.ts]
import { type AnyIntegrationEvent, EventPublisher } from "@alveolus/core";
import type { Producer } from "kafkajs";

export class KafkaEventPublisher extends EventPublisher {
	constructor(private readonly producer: Producer) {
		super();
	}

	async publish(
		events: readonly AnyIntegrationEvent[],
	): Promise<void> {
		for (const event of events) {
			await this.producer.send({
				messages: [{ value: JSON.stringify(event) }], // [!code --]
				messages: [ // [!code ++]
					{ key: event.id, value: JSON.stringify(event) }, // [!code ++]
				], // [!code ++]
				topic: `${event.source}.${event.type}`,
			});
		}
	}
}
```

This is the complete publisher.

### 5. Wire it to the relay

The composition root passes the publisher to the [`OutboxRelay`](./outbox.md#usage), the only caller of `publish`.

```ts [src/app.module.ts]
const relay = new OutboxRelay(
	outbox,
	new KafkaEventPublisher(producer),
	100,
);
```

### 6. Check it

Run the checks. Two rules keep the publisher the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-portless-adapter"><code>no-portless-adapter</code></a></span>It extends the port it implements.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>driven/kafka/adapters/*.adapter.ts</code>.</div>
</div>

The same class without <code>extends EventPublisher</code> is reported:

```
src/shared-kernel/driven/kafka/adapters/kafka-event-publisher.adapter.ts
  4  layers/no-portless-adapter: KafkaEventPublisher is a driven
  adapter but extends no Port: extend the port it implements.
```

## See also

- [Outbox](./outbox.md), whose relay calls the publisher
- [Integration events](./integration-events.md), what is published
- [Ports](../domain/ports.md), what an event publisher is
- Rules: [`layers/no-portless-adapter`](../../rules/layers/no-portless-adapter.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
