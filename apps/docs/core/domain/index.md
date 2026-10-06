---
description: "The domain layer in Domain-Driven Design with TypeScript: the model of the business, its objects and rules, free of frameworks and infrastructure."
---

# Domain

The domain is the model of the business: its objects, its rules and what happens to them. It lives
in `domain/` and imports nothing but the domain and `@alveolus/core`.

## Why

When the rule "an order cannot be placed empty" sits in a controller, a SQL query and a cron job,
each copy drifts and nobody knows which one is right. When it imports an ORM or a framework, it
cannot be read or tested without them.

::: tip The fix
The rules live in one place, in plain TypeScript classes named after the business. Everything else
calls them.
:::

## How the blocks fit together

<div class="al-diagram">
<svg viewBox="0 0 680 300" role="img" aria-label="The Order aggregate holds the Order root, its OrderLine entities and value objects such as OrderId. The root records the OrderPlaced domain event and returns domain errors such as EmptyOrder; a domain service such as OrderLimit checks rules across aggregates. Below, the Orders repository loads and saves the aggregate, the Clock port gives the time and the OrderSummary view is what queries read.">
	<defs>
		<marker id="domain-overview-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="8" width="380" height="200" rx="14" />
	<text class="note" x="24" y="30">Order · aggregate</text>
	<rect class="box" x="118" y="44" width="160" height="48" rx="8" />
	<text class="label" x="198" y="64" text-anchor="middle">Order</text>
	<text class="note" x="198" y="82" text-anchor="middle">root</text>
	<rect class="box" x="28" y="138" width="160" height="48" rx="8" />
	<text class="label" x="108" y="158" text-anchor="middle">OrderLine</text>
	<text class="note" x="108" y="176" text-anchor="middle">entity</text>
	<rect class="box" x="208" y="138" width="160" height="48" rx="8" />
	<text class="label" x="288" y="158" text-anchor="middle">OrderId</text>
	<text class="note" x="288" y="176" text-anchor="middle">value object</text>
	<path class="link" d="M 170 92 L 120 136" marker-end="url(#domain-overview-arrow)" />
	<path class="link" d="M 226 92 L 276 136" marker-end="url(#domain-overview-arrow)" />
	<rect class="box" x="472" y="20" width="200" height="48" rx="8" />
	<text class="label" x="572" y="40" text-anchor="middle">OrderPlaced</text>
	<text class="note" x="572" y="58" text-anchor="middle">domain event · recorded</text>
	<rect class="box" x="472" y="88" width="200" height="48" rx="8" />
	<text class="label" x="572" y="108" text-anchor="middle">EmptyOrder</text>
	<text class="note" x="572" y="126" text-anchor="middle">domain error · returned</text>
	<rect class="box" x="472" y="156" width="200" height="48" rx="8" />
	<text class="label" x="572" y="176" text-anchor="middle">OrderLimit</text>
	<text class="note" x="572" y="194" text-anchor="middle">domain service</text>
	<path class="link" d="M 278 62 L 470 44" marker-end="url(#domain-overview-arrow)" />
	<path class="link" d="M 278 72 L 470 112" marker-end="url(#domain-overview-arrow)" />
	<path class="link" d="M 470 180 L 390 180" stroke-dasharray="4 4" marker-end="url(#domain-overview-arrow)" />
	<text class="note" x="430" y="172" text-anchor="middle">checks</text>
	<rect class="box" x="8" y="240" width="210" height="48" rx="8" />
	<text class="label" x="113" y="260" text-anchor="middle">Orders</text>
	<text class="note" x="113" y="278" text-anchor="middle">repository · load, save</text>
	<path class="link" d="M 113 240 L 113 210" marker-end="url(#domain-overview-arrow)" />
	<rect class="box" x="235" y="240" width="210" height="48" rx="8" />
	<text class="label" x="340" y="260" text-anchor="middle">Clock</text>
	<text class="note" x="340" y="278" text-anchor="middle">port · outside world</text>
	<rect class="box" x="462" y="240" width="210" height="48" rx="8" />
	<text class="label" x="567" y="260" text-anchor="middle">OrderSummary</text>
	<text class="note" x="567" y="278" text-anchor="middle">view · read by queries</text>
</svg>
</div>

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Model</span>An <a href="/core/domain/aggregates">aggregate</a> groups <a href="/core/domain/entities">entities</a> and <a href="/core/domain/value-objects">value objects</a> behind a root that keeps the rules.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Outcomes</span>A change records a <a href="/core/domain/domain-events">domain event</a>; a refusal returns a <a href="/core/domain/domain-errors">domain error</a>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Outside world</span><a href="/core/domain/repositories">Repositories</a> and <a href="/core/domain/ports">ports</a> say what the domain needs, in its words. Adapters do the rest.</div>
</div>

## The building blocks

| Building block | What it is | Use it when |
| --- | --- | --- |
| [Aggregates](./aggregates.md) | A group of objects changed together through one root, which keeps their rules. | Some rules must hold after every change. |
| [Entities](./entities.md) | An object defined by its identity, inside an aggregate. | A part of an aggregate changes over time and must be told apart. |
| [Value objects](./value-objects.md) | An immutable value compared by its attributes, and the typed identifiers. | A number or a string has rules or a unit: an amount, an email, an id. |
| [Domain events](./domain-events.md) | Something that happened in the domain, in the past tense. | Something else must react to a change. |
| [Domain errors](./domain-errors.md) | An expected business failure, returned as a value. | A business rule refuses a request. |
| [Domain services](./domain-services.md) | A stateless operation that belongs to no single object. | A rule needs several aggregates and belongs to none. |
| [Ports](./ports.md) | What the domain needs from the outside world, in its own words. | The domain needs the time, an id, a payment, another context. |
| [Repositories](./repositories.md) | How aggregates are loaded and saved, and how views are read. | An aggregate must be stored, or a query must read data. |
| [Views](./views.md) | What a query returns. | A screen or an API needs data shaped for reading. |

## See also

- [Application](../application/index.md), the use cases that call the domain
- [Strategic](../strategic/index.md), how contexts meet
- Rules: [`layers/no-impure-domain`](../../rules/layers/no-impure-domain.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
