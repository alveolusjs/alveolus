---
description: "The application layer in Domain-Driven Design with TypeScript: command and query handlers that run use cases atomically and reliably."
---

# Application

The application runs the use cases: one handler per request, which calls the domain and makes the
change atomic and reliable. It lives in `application/`; the adapters of its contracts live in
`driven/`.

## Why

A controller that loads an order, checks it, saves it and sends an email mixes HTTP, rules and
storage. A second entry point, a consumer or a CLI, copies it. If the email leaves before the save
fails, the customer is told about an order that does not exist.

::: tip The fix
Each use case is one handler that only coordinates: load, call the domain, save, hand over the
events. The save and the events commit together, and the events are sent after.
:::

## How a request flows

<div class="al-diagram">
<svg viewBox="0 0 680 310" role="img" aria-label="A command goes from a controller to PlaceOrderHandler, which in one unit of work saves the order and adds the events translated by OrderEventsTranslator to the outbox. Later, OutboxRelay reads the outbox and the event publisher sends the integration events to other contexts. A query goes from a controller to GetOrderSummaryHandler, which reads a view through a query repository.">
	<defs>
		<marker id="application-overview-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<text class="note" x="8" y="20">command</text>
	<rect class="box" x="8" y="50" width="120" height="48" rx="8" />
	<text class="label" x="68" y="70" text-anchor="middle">Controller</text>
	<text class="note" x="68" y="88" text-anchor="middle">driving</text>
	<rect class="boundary" x="146" y="28" width="526" height="80" rx="12" />
	<text class="note" x="160" y="44">one unit of work</text>
	<rect class="box" x="160" y="52" width="160" height="44" rx="8" />
	<text class="label" x="240" y="70" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="240" y="87" text-anchor="middle">command handler</text>
	<rect class="box" x="342" y="52" width="160" height="44" rx="8" />
	<text class="label" x="422" y="70" text-anchor="middle">OrderEventsTranslator</text>
	<text class="note" x="422" y="87" text-anchor="middle">event translator</text>
	<rect class="box" x="524" y="52" width="136" height="44" rx="8" />
	<text class="label" x="592" y="70" text-anchor="middle">Outbox</text>
	<text class="note" x="592" y="87" text-anchor="middle">with the save</text>
	<path class="link" d="M 128 74 L 158 74" marker-end="url(#application-overview-arrow)" />
	<path class="link" d="M 320 74 L 340 74" marker-end="url(#application-overview-arrow)" />
	<path class="link" d="M 502 74 L 522 74" marker-end="url(#application-overview-arrow)" />
	<text class="note" x="8" y="136">later</text>
	<rect class="box" x="524" y="150" width="148" height="48" rx="8" />
	<text class="label" x="598" y="170" text-anchor="middle">OutboxRelay</text>
	<text class="note" x="598" y="188" text-anchor="middle">reads pending</text>
	<rect class="box" x="342" y="150" width="160" height="48" rx="8" />
	<text class="label" x="422" y="170" text-anchor="middle">EventPublisher</text>
	<text class="note" x="422" y="188" text-anchor="middle">sends them</text>
	<rect class="box" x="160" y="150" width="160" height="48" rx="8" />
	<text class="label" x="240" y="170" text-anchor="middle">Other contexts</text>
	<text class="note" x="240" y="188" text-anchor="middle">integration events</text>
	<path class="link" d="M 598 108 L 598 148" marker-end="url(#application-overview-arrow)" />
	<path class="link" d="M 524 174 L 504 174" marker-end="url(#application-overview-arrow)" />
	<path class="link" d="M 342 174 L 322 174" marker-end="url(#application-overview-arrow)" />
	<text class="note" x="8" y="226">query</text>
	<rect class="box" x="8" y="244" width="120" height="48" rx="8" />
	<text class="label" x="68" y="264" text-anchor="middle">Controller</text>
	<text class="note" x="68" y="282" text-anchor="middle">driving</text>
	<rect class="box" x="160" y="244" width="204" height="48" rx="8" />
	<text class="label" x="262" y="264" text-anchor="middle">GetOrderSummaryHandler</text>
	<text class="note" x="262" y="282" text-anchor="middle">query handler</text>
	<rect class="box" x="396" y="244" width="200" height="48" rx="8" />
	<text class="label" x="496" y="264" text-anchor="middle">OrderSummaries</text>
	<text class="note" x="496" y="282" text-anchor="middle">query repository · a view</text>
	<path class="link" d="M 128 268 L 158 268" marker-end="url(#application-overview-arrow)" />
	<path class="link" d="M 364 268 L 394 268" marker-end="url(#application-overview-arrow)" />
</svg>
</div>

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Change</span>A <a href="/core/application/command-handlers">command handler</a> loads an aggregate, calls it and saves it, inside a <a href="/core/application/unit-of-work">unit of work</a>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Announce</span>An <a href="/core/application/event-translators">event translator</a> turns domain events into <a href="/core/application/integration-events">integration events</a>, stored in the <a href="/core/application/outbox">outbox</a> with the change.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Deliver</span>The relay hands them to an <a href="/core/application/event-publishers">event publisher</a>. A <a href="/core/application/query-handlers">query handler</a> reads, on its own path.</div>
</div>

## The building blocks

| Building block | What it is | Use it when |
| --- | --- | --- |
| [Command handlers](./command-handlers.md) | The application service of one use case that changes the system. | A request changes state: create, place, cancel. |
| [Query handlers](./query-handlers.md) | The application service of one read. | A request only reads. |
| [Event translators](./event-translators.md) | Turns domain events into integration events. | Other contexts must hear about a change. |
| [Integration events](./integration-events.md) | What other contexts receive when something happens: JSON. | You define what leaves your context. |
| [Event publishers](./event-publishers.md) | Sends integration events to the rest of the system. | You plug in a broker, or deliver in process. |
| [Unit of Work](./unit-of-work.md) | Makes a use case atomic: commit on success, roll back otherwise. | A use case writes more than once, or writes and records events. |
| [Outbox](./outbox.md) | Stores integration events with the change, then relays them, so none is lost. | Events must not be lost nor sent for a change that failed. |

## See also

- [Domain](../domain/index.md), what the handlers call
- [Strategic](../strategic/index.md), how contexts meet
- Rules: [`layers/no-outward-import`](../../rules/layers/no-outward-import.md), [`tactical/no-mixed-handler`](../../rules/tactical/no-mixed-handler.md)
