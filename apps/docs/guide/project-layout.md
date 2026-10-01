# Project layout

Every Alveolus project has the same shape: the same folders, the same file names, the same
direction between layers. Whoever opens the code, a teammate or an agent, knows where a concept
lives before searching for it, and `alveolus arch check` keeps it that way.

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

## At a glance

```
src/
  main.ts                     # starts the application
  app.module.ts               # assembles the bounded contexts
  ordering/                   # a bounded context
    ordering.module.ts        # its composition root
    domain/
      aggregates/             # order.aggregate.ts
      entities/               # order-line.entity.ts
      value-objects/          # money.value-object.ts, order-id.identifier.ts
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
      nestjs/
        controllers/          # orders.controller.ts
        consumers/            # payment-received.consumer.ts
  catalog/                    # another bounded context, same shape
  shared-kernel/              # shared by every bounded context, same shape
```

Only create a folder when it gets its first file: a small context may have no `entities/`,
`services/` or `driving/nestjs/consumers/`.

## Bounded contexts

A bounded context is a folder under `src/`, declared in `alveolus.config.ts`. Contexts may be
nested, for instance under `src/modules/`. Each one has its own model: a `Product` in the catalog
and a product in ordering are two different things, and neither imports the other.

A context is closed. The only class another context may import is an **open host service**, and
only from an **anti-corruption layer** or from its composition root. What crosses the boundary is
the published language: plain JSON that the reader redeclares on its side, never the classes of
the other model.

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
adapter changes.

## Layers

| Layer | Holds | May import |
| --- | --- | --- |
| `domain/` | The model: aggregates, entities, value objects, events, errors, domain services, and the ports and repositories it needs. | The domain of its context and of the shared kernel, the domain building blocks of `@alveolus/core`, the packages listed in `domainDependencies`. No framework, no ORM. |
| `application/` | One class per use case: command handlers, query handlers, and the translators that turn domain events into the published language. | The domain, the application, its own published language, `@alveolus/core`, `domainDependencies`. From NestJS, only `@Injectable()`. |
| `published-language/` | The JSON types exchanged with other contexts: what this context publishes, and what it reads from the others. | Its own published language, the published-language types of core, and packages such as a schema library. |
| `driven/` | The adapters that implement the ports: database repositories, API clients, the outbox, the clock. | The domain, the application, the published language, any package. Never `driving/`. |
| `driving/` | The adapters that call the use cases: HTTP controllers, message consumers, scheduled jobs, CLI commands. | The domain, the application, the published language, any package. Never `driven/`. |

Inside `driven/` and `driving/`, files always sit under the name of their technology:
`driven/pg/adapters/`, `driven/http/adapters/`, `driving/nestjs/controllers/`. Replacing a
technology then means adding a folder next to the old one, never touching it. An adapter that calls
another bounded context in the same process sits under the name of that context:
`driven/catalog/adapters/`. Inside `domain/` and `application/`, every
class extends a building block of `@alveolus/core`: there are no free functions and no plain
classes.

## Folders and file names

Each class goes in the folder of its kind, in a file whose name ends with that kind. One class per
file; the types that belong to it, such as its snapshot or its command input, stay in its file.

| Kind | Extends | Folder | File name |
| --- | --- | --- | --- |
| Aggregate | `AggregateRoot` | `domain/aggregates/` | `order.aggregate.ts` |
| Entity | `Entity` | `domain/entities/` | `order-line.entity.ts` |
| Value object | `ValueObject` | `domain/value-objects/` | `money.value-object.ts` |
| Identifier | `Identifier` | `domain/value-objects/` | `order-id.identifier.ts` |
| Domain event | `DomainEvent` | `domain/events/` | `order-placed.event.ts` |
| Domain error | `DomainError` | `domain/errors/` | `invalid-total.error.ts` |
| Domain service | `DomainService` | `domain/services/` | `shipping-cost.service.ts` |
| Repository | `CommandRepository`, `QueryRepository` | `domain/repositories/` | `orders.repository.ts` |
| Port | `Port` | `domain/ports/` | `price-list.port.ts` |
| View | a `View<…>` type | `domain/views/` | `order-summary.view.ts` |
| Command handler | `CommandHandler` | `application/commands/` | `place-order.command.ts` |
| Query handler | `QueryHandler` | `application/queries/` | `get-order-summary.query.ts` |
| Event translator | `EventTranslator` | `application/translators/` | `order-events.translator.ts` |
| Representation | a `PublishedLanguage<…>` type | `published-language/` | `order-placed.representation.ts` |
| Driven adapter | a port | `driven/<technology>/adapters/` | `pg-orders.adapter.ts` |
| Open host service | implements `OpenHostService` | `driving/<technology>/` | free |

Tests sit next to the code they test and keep its name: `order.aggregate.spec.ts` or
`order.aggregate.test.ts`.

## Composition root

Each bounded context has one file at its root that wires its adapters into its use cases: with
NestJS, its module, `ordering.module.ts`. It is the only file that sees every layer, and the only
one, besides an anti-corruption layer, that may import from another context: another context's
module, to reach its open host services.

At the root of `src/`, `main.ts` starts the application and `app.module.ts` imports the module of
each bounded context. These files import composition roots only.

## Shared kernel

`src/shared-kernel/` holds what every bounded context needs in the same form: value objects such
as `Money`, ports such as a tracer, and their adapters. It has the same layers as a bounded
context, possibly grouped by feature (`shared-kernel/time/driven/system/adapters/`). Every context may import it;
it imports none of them.

Keep it small: each change to the shared kernel reaches every context. `Clock` and `IdGenerator`
already come with `@alveolus/core`; only their adapters live here.

## Who may import what

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

From another bounded context, only an open host service may be imported, by an anti-corruption
layer or the composition root.

## Checked for you

`alveolus arch check` verifies this layout on every run: see the [rules](../rules/index.md), one page
per rule, with what each one checks and why.
