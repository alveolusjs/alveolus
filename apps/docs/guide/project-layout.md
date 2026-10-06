---
description: "The folder structure of a Domain-Driven Design project in TypeScript: bounded contexts, domain, application, adapters and the direction between layers."
---

# Project layout

Every Alveolus project has the same shape: the same folders, the same file names, the same
direction between layers.

<dl class="al-glance">
	<dt>Unit</dt><dd>A <a href="#bounded-contexts">bounded context</a>: a folder under <code>src/</code>, such as <code>src/ordering/</code></dd>
	<dt>Layers</dt><dd><a href="#layers"><code>domain/</code>, <code>application/</code>, <code>published-language/</code>, <code>driven/</code>, <code>driving/</code></a></dd>
	<dt>Wired by</dt><dd><a href="#composition-root">The composition root</a>, <code>ordering.module.ts</code></dd>
	<dt>Shared</dt><dd><a href="#shared-kernel"><code>src/shared-kernel/</code></a>, same shape</dd>
	<dt>Checked by</dt><dd><a href="/rules/layers/no-outward-import"><code>layers/no-outward-import</code></a>, <a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a>, <a href="/rules/layers/no-impure-domain"><code>layers/no-impure-domain</code></a></dd>
</dl>

## Why

A new teammate looks for the rule that refuses an empty order. Is it in the controller, a service,
a helper, the repository? An agent asked to add a rule puts it wherever the task led it. Each
project invents its own layout, and each layout erodes a little with every change.

::: tip The fix
One layout for every project, kept by `alveolus arch check`. Knowing what a class is tells you
where it lives, and the other way round: the rule is in `domain/aggregates/order.aggregate.ts`,
because that is where it can only be.
:::

## How it works

A bounded context is split into layers, each in its folder. The domain sits at the center, the
application around it, the adapters at the edge; the composition root wires them together.

<div class="al-diagram">
<svg viewBox="0 0 680 380" role="img" aria-label="A bounded context. Its composition root wires four layers. Driving adapters call the application, the application uses the domain, driven adapters implement the ports of the domain. The published language is the format exchanged with other contexts. Every dependency points towards the domain.">
	<defs>
		<marker id="layout-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="8" width="664" height="364" rx="14" />
	<text class="note" x="24" y="32">src/ordering/ · a bounded context</text>
	<rect class="box" x="200" y="46" width="280" height="48" rx="8" />
	<text class="label" x="340" y="68" text-anchor="middle">composition root</text>
	<text class="note" x="340" y="85" text-anchor="middle">ordering.module.ts · wires it all</text>
	<rect class="box" x="28" y="128" width="150" height="150" rx="8" />
	<text class="label" x="103" y="160" text-anchor="middle">driving/</text>
	<text class="note" x="103" y="184" text-anchor="middle">controllers</text>
	<text class="note" x="103" y="202" text-anchor="middle">consumers</text>
	<text class="note" x="103" y="220" text-anchor="middle">jobs, CLI…</text>
	<text class="note" x="103" y="258" text-anchor="middle">calls use cases</text>
	<rect class="box" x="502" y="128" width="150" height="150" rx="8" />
	<text class="label" x="577" y="160" text-anchor="middle">driven/</text>
	<text class="note" x="577" y="184" text-anchor="middle">repositories</text>
	<text class="note" x="577" y="202" text-anchor="middle">API clients</text>
	<text class="note" x="577" y="220" text-anchor="middle">outbox, clock…</text>
	<text class="note" x="577" y="258" text-anchor="middle">implements ports</text>
	<rect class="box" x="210" y="118" width="260" height="170" rx="10" />
	<text class="label" x="340" y="142" text-anchor="middle">application/</text>
	<text class="note" x="340" y="160" text-anchor="middle">commands · queries</text>
	<rect class="boundary" x="228" y="176" width="224" height="96" rx="8" />
	<text class="label" x="340" y="204" text-anchor="middle">domain/</text>
	<text class="note" x="340" y="224" text-anchor="middle">aggregates · entities</text>
	<text class="note" x="340" y="242" text-anchor="middle">value objects · events</text>
	<text class="note" x="340" y="260" text-anchor="middle">errors · services · ports</text>
	<rect class="box" x="230" y="314" width="220" height="44" rx="8" />
	<text class="label" x="340" y="334" text-anchor="middle">published-language/</text>
	<text class="note" x="340" y="350" text-anchor="middle">what other contexts read</text>
	<path class="link" d="M 178 203 L 208 203" marker-end="url(#layout-arrow)" />
	<path class="link" d="M 502 224 L 454 224" marker-end="url(#layout-arrow)" />
	<path class="link" d="M 340 288 L 340 312" marker-end="url(#layout-arrow)" />
	<path class="link" d="M 103 278 L 103 336 L 228 336" marker-end="url(#layout-arrow)" />
	<path class="link" d="M 577 278 L 577 336 L 452 336" marker-end="url(#layout-arrow)" />
	<path class="link" d="M 230 94 L 140 126" marker-end="url(#layout-arrow)" />
	<path class="link" d="M 450 94 L 540 126" marker-end="url(#layout-arrow)" />
	<path class="link" d="M 340 94 L 340 116" marker-end="url(#layout-arrow)" />
</svg>
</div>

Arrows read "depends on". They all point inwards: the domain depends on nothing but itself, so the
business rules never change because a database, a framework or another context did.

## The tree

```
src/
  main.ts                     # starts the application
  app.module.ts               # assembles the bounded contexts
  ordering/                   # a bounded context
    ordering.module.ts        # its composition root
    domain/
      aggregates/             # order.aggregate.ts
      entities/               # order-line.entity.ts
      value-objects/          # order-id.identifier.ts
      events/                 # order-placed.event.ts
      errors/                 # invalid-total.error.ts
      services/               # shipping-cost.service.ts
      repositories/           # orders.repository.ts
      ports/                  # price-list.port.ts
      views/                  # order-summary.view.ts
    application/
      commands/               # place-order.command.ts
      queries/                # get-order-summary.query.ts
      translators/            # order-events.translator.ts
    published-language/       # order-placed.representation.ts
    driven/
      pg/
        adapters/             # pg-orders.adapter.ts
      catalog/
        adapters/             # catalog-price-list.adapter.ts
    driving/
      http/
        controllers/          # orders.controller.ts
      rabbitmq/
        consumers/            # payment-received.consumer.ts
  catalog/                    # another bounded context, same shape
  shared-kernel/              # shared by every bounded context, same shape
```

Only create a folder when it gets its first file: a small context may have no `entities/`,
`services/` or `driving/rabbitmq/`.

## Bounded contexts

A bounded context is a folder under `src/`, declared in
[`alveolus.config.ts`](./getting-started.md#configure-the-checks). Contexts may be nested, for
instance under `src/modules/`. Each one has its own model: a `Product` in the catalog and a product
in ordering are two different things, and neither imports the other.

<div class="al-cards">
<div class="al-card"><span class="al-card-title">Closed</span>The only class another context may import is its <a href="../core/strategic/open-host-services">open host service</a>.</div>
<div class="al-card"><span class="al-card-title">Entered at one place</span>Only an <a href="../core/strategic/anti-corruption-layers">anti-corruption layer</a> or the composition root may import that service.</div>
<div class="al-card"><span class="al-card-title">Talking in JSON</span>What crosses the boundary is the <a href="../core/strategic/published-language">published language</a>, redeclared by the reader, never the classes of the other model.</div>
</div>

<div class="al-diagram">
<svg viewBox="0 0 680 230" role="img" aria-label="Two bounded contexts. In ordering, the anti-corruption layer CatalogPriceList implements the PriceList port of the domain and imports CatalogApi, the open host service of catalog. A direct import from the ordering domain to the catalog domain is forbidden.">
	<defs>
		<marker id="boundary-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="8" width="300" height="214" rx="14" />
	<text class="note" x="24" y="32">src/catalog/</text>
	<rect class="box" x="30" y="50" width="256" height="58" rx="8" />
	<text class="label" x="158" y="74" text-anchor="middle">CatalogApi</text>
	<text class="note" x="158" y="94" text-anchor="middle">driving/ · OpenHostService</text>
	<rect class="box" x="30" y="146" width="256" height="58" rx="8" />
	<text class="label" x="158" y="170" text-anchor="middle">Product</text>
	<text class="note" x="158" y="190" text-anchor="middle">domain/aggregates/</text>
	<rect class="boundary" x="372" y="8" width="300" height="214" rx="14" />
	<text class="note" x="388" y="32">src/ordering/</text>
	<rect class="box" x="394" y="50" width="256" height="58" rx="8" />
	<text class="label" x="522" y="74" text-anchor="middle">CatalogPriceList</text>
	<text class="note" x="522" y="94" text-anchor="middle">driven/ · AntiCorruptionLayer</text>
	<rect class="box" x="394" y="146" width="256" height="58" rx="8" />
	<text class="label" x="522" y="170" text-anchor="middle">PriceList</text>
	<text class="note" x="522" y="190" text-anchor="middle">domain/ports/</text>
	<path class="link" d="M 394 79 L 288 79" marker-end="url(#boundary-arrow)" />
	<text class="note" x="341" y="70" text-anchor="middle">imports</text>
	<path class="link" d="M 522 108 L 522 144" marker-end="url(#boundary-arrow)" />
	<text class="note" x="530" y="131">extends</text>
	<path class="link" d="M 394 175 L 288 175" stroke-dasharray="4 4" marker-end="url(#boundary-arrow)" />
	<text class="label" x="341" y="166" text-anchor="middle">✕</text>
	<text class="note" x="341" y="196" text-anchor="middle">never</text>
</svg>
</div>

The ordering domain asks for prices in its own words, through the `PriceList` port. The
anti-corruption layer is the one place that knows the catalog exists: it calls `CatalogApi`,
reads its JSON and answers with ordering's objects. If the catalog moves behind HTTP, only that
adapter changes. Checked by [`strategic/no-cross-context-import`](../rules/strategic/no-cross-context-import.md).

## Layers

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><code>domain/</code></span>The model: aggregates, entities, value objects, events, errors, domain services, and the ports and repositories it needs. No framework, no ORM.</div>
<div class="al-card"><span class="al-card-title"><code>application/</code></span>One class per use case: command handlers, query handlers, and the translators that turn domain events into the published language.</div>
<div class="al-card"><span class="al-card-title"><code>published-language/</code></span>The JSON types exchanged with other contexts: what this context publishes, and what it reads from the others.</div>
<div class="al-card"><span class="al-card-title"><code>driven/</code></span>The adapters that implement the ports: database repositories, API clients, the outbox, the clock.</div>
<div class="al-card"><span class="al-card-title"><code>driving/</code></span>The adapters that call the use cases: HTTP controllers, message consumers, scheduled jobs, CLI commands.</div>
</div>

### Who may import what

Read a row as "files in this layer may import…", within the same bounded context or from the
shared kernel.

| From ↓ · To → | domain | application | published-language | driven | driving | composition root |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| **domain** | ✓ | ✕ | ✕ | ✕ | ✕ | ✕ |
| **application** | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ |
| **published-language** | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ |
| **driven** | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ |
| **driving** | ✓ | ✓ | ✓ | ✕ | ✓ | ✕ |
| **composition root** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Outside the project, the domain may import the domain building blocks of `@alveolus/core` and the
packages listed in `domainDependencies`; the application adds the rest of `@alveolus/core` and
`applicationDependencies`; the published language may import the published-language types of core
and packages such as a schema library; adapters may import any package. Checked by
[`layers/no-outward-import`](../rules/layers/no-outward-import.md) and [`layers/no-impure-domain`](../rules/layers/no-impure-domain.md).

### Adapters by technology

Inside `driven/` and `driving/`, files always sit under the name of their technology:
`driven/pg/adapters/`, `driven/http/adapters/`, `driving/http/controllers/`. Replacing a
technology then means adding a folder next to the old one, never touching it. An adapter that calls
another bounded context in the same process sits under the name of that context:
`driven/catalog/adapters/`. Every class in `driven/<technology>/adapters/` extends a port of the
domain: checked by [`layers/no-portless-adapter`](../rules/layers/no-portless-adapter.md).

::: tip
Inside `domain/` and `application/`, every class extends a building block of `@alveolus/core`:
there are no free functions and no plain classes. Checked by
[`tactical/no-plain-class`](../rules/tactical/no-plain-class.md).
:::

## Folders and file names

Each class goes in the folder of its kind, in a file whose name ends with that kind. One class per
file; the types that belong to it, such as its snapshot or its command input, stay in its file.
Checked by [`tactical/no-misplaced-class`](../rules/tactical/no-misplaced-class.md).

### In `domain/`

| Kind | Extends | Folder | File name |
| --- | --- | --- | --- |
| Aggregate | `AggregateRoot` | `aggregates/` | `order.aggregate.ts` |
| Entity | `Entity` | `entities/` | `order-line.entity.ts` |
| Value object | `ValueObject` | `value-objects/` | `money.value-object.ts` |
| Identifier | `Identifier` | `value-objects/` | `order-id.identifier.ts` |
| Domain event | `DomainEvent` | `events/` | `order-placed.event.ts` |
| Domain error | `DomainError` | `errors/` | `invalid-total.error.ts` |
| Domain service | `DomainService` | `services/` | `shipping-cost.service.ts` |
| Repository | `CommandRepository`<br>`QueryRepository` | `repositories/` | `orders.repository.ts` |
| Port | `Port` | `ports/` | `price-list.port.ts` |
| View | `View<…>` type | `views/` | `order-summary.view.ts` |

### In `application/`

| Kind | Extends | Folder | File name |
| --- | --- | --- | --- |
| Command handler | `CommandHandler` | `commands/` | `place-order.command.ts` |
| Query handler | `QueryHandler` | `queries/` | `get-order-summary.query.ts` |
| Event translator | `EventTranslator` | `translators/` | `order-events.translator.ts` |

### Around them

| Kind | Folder | File name |
| --- | --- | --- |
| Representation | `published-language/` | `order-placed.representation.ts` |
| Driven adapter | `driven/pg/adapters/` | `pg-orders.adapter.ts` |
| Open host service | `driving/<technology>/` | free |

A representation is a `PublishedLanguage<…>` type, a driven adapter extends a port, an open host
service implements `OpenHostService`.

Tests sit next to the code they test and keep its name: `order.aggregate.spec.ts` or
`order.aggregate.test.ts`.

## Composition root

Each bounded context has one file at its root that wires its adapters into its use cases, its
module: `ordering.module.ts`. It is a class that builds everything with `new`, or the module of your
framework's container, such as a NestJS `@Module`: see [Integrations](../integrations/index.md).

::: tip
It is the only file that sees every layer, and the only one, besides an anti-corruption layer, that
may import from another context: another context's module, to reach its open host services.
:::

At the root of `src/`, `main.ts` starts the application and `app.module.ts` builds or imports the
module of each bounded context. These files import composition roots only.

## Shared kernel

`src/shared-kernel/` holds what every bounded context needs in the same form: value objects such
as `Money`, ports such as a tracer, and their adapters. It has the same layers as a bounded
context, possibly grouped by feature (`shared-kernel/time/driven/system/adapters/`). Every context
may import it; it imports none of them.

::: warning Keep it small
Each change to the shared kernel reaches every context. `Clock` and `IdGenerator` already come
with `@alveolus/core`; only their adapters live here.
:::

## See also

- [Getting started](./getting-started.md), to configure and run the checks
- [Building blocks](../core/index.md), the classes each folder holds
- [Integrations](../integrations/index.md), to write the composition root with your framework
- Rules: [`layers/no-outward-import`](../rules/layers/no-outward-import.md), [`tactical/no-misplaced-class`](../rules/tactical/no-misplaced-class.md), [`strategic/no-cross-context-import`](../rules/strategic/no-cross-context-import.md), [`layers/no-impure-domain`](../rules/layers/no-impure-domain.md), [`tactical/no-plain-class`](../rules/tactical/no-plain-class.md), [`layers/no-portless-adapter`](../rules/layers/no-portless-adapter.md)
