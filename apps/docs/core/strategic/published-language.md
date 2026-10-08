---
description: "Published Language in Domain-Driven Design: the JSON contract that bounded contexts exchange instead of importing each other's code."
---

# Published Language

The published language is the JSON that bounded contexts exchange: the contract between them,
instead of their code.

<dl class="al-glance">
	<dt>Layer</dt><dd>Published language</dd>
	<dt>File</dt><dd><code>src/catalog/published-language/product.representation.ts</code></dd>
	<dt>Wraps</dt><dd><a href="#api"><code>PublishedLanguage&lt;Representation&gt;</code></a></dd>
	<dt>Used by</dt><dd><a href="/core/strategic/open-host-services">Open host services</a>, <a href="/core/strategic/anti-corruption-layers">anti-corruption layers</a>, <a href="/core/application/integration-events">integration events</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a>, <a href="/rules/layers/no-outward-import"><code>layers/no-outward-import</code></a></dd>
</dl>

## Why

Ordering needs the price of a product. The quickest way is to import the `Product` aggregate of
the catalog, or its repository. From then on, every rename in the catalog breaks ordering, and the
catalog can no longer change its model without asking every context that reads it.

::: tip The fix
The catalog publishes a format: plain JSON, named and typed, one file per representation. Other
contexts depend on that format, never on the code behind it, and the catalog changes its model
freely as long as the format holds.
:::

## How it works

A representation is a type wrapped in `PublishedLanguage<…>`. The wrapper changes nothing at
runtime: it checks, at compile time, that the type is JSON. Each side of the exchange declares the
representation in its own `published-language/` folder.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>The upstream publishes</span>The catalog declares <code>ProductRepresentation</code>: everything it agrees to expose.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Its open host service answers</span><a href="/core/strategic/open-host-services">CatalogApi</a> maps the domain to the representation.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>The downstream reads</span>Ordering declares only the fields it reads; its <a href="/core/strategic/anti-corruption-layers">anti-corruption layer</a> turns them into its own objects.</div>
</div>

## Where it fits

The published language is what crosses the line between two contexts: the answer of an open host
service, the payload of an [integration event](../application/integration-events.md). Nothing else
crosses it.

<div class="al-diagram">
<svg viewBox="0 0 720 260" role="img" aria-label="In ordering, AddLineHandler asks the PriceList port for a price. CatalogPriceList, the anti-corruption layer, extends the port and reads the JSON answered by CatalogApi, the open host service of catalog, which calls GetProductHandler.">
	<defs>
		<marker id="pl-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="8" width="272" height="244" rx="14" />
	<text class="note" x="24" y="30">src/ordering/</text>
	<rect class="box" x="24" y="44" width="240" height="48" rx="8" />
	<text class="label" x="144" y="64" text-anchor="middle">AddLineHandler</text>
	<text class="note" x="144" y="82" text-anchor="middle">asks for a price</text>
	<rect class="box" x="24" y="116" width="240" height="48" rx="8" />
	<text class="label" x="144" y="136" text-anchor="middle">PriceList</text>
	<text class="note" x="144" y="154" text-anchor="middle">port · in your words</text>
	<rect class="box" x="24" y="188" width="240" height="48" rx="8" />
	<text class="label" x="144" y="208" text-anchor="middle">CatalogPriceList</text>
	<text class="note" x="144" y="226" text-anchor="middle">anti-corruption layer</text>
	<path class="link" d="M 144 92 L 144 114" marker-end="url(#pl-flow-arrow)" />
	<path class="link" d="M 144 188 L 144 166" marker-end="url(#pl-flow-arrow)" />
	<text class="note" x="154" y="181">extends</text>
	<rect class="boundary" x="300" y="188" width="156" height="48" rx="8" />
	<text class="label" x="378" y="208" text-anchor="middle">JSON</text>
	<text class="note" x="378" y="226" text-anchor="middle">the contract</text>
	<path class="link" d="M 300 212 L 266 212" marker-end="url(#pl-flow-arrow)" />
	<path class="link" d="M 492 212 L 458 212" marker-end="url(#pl-flow-arrow)" />
	<rect class="box" x="476" y="8" width="236" height="244" rx="14" />
	<text class="note" x="492" y="30">src/catalog/</text>
	<rect class="box" x="492" y="44" width="204" height="48" rx="8" />
	<text class="label" x="594" y="64" text-anchor="middle">GetProductHandler</text>
	<text class="note" x="594" y="82" text-anchor="middle">reads the catalog</text>
	<rect class="box" x="492" y="188" width="204" height="48" rx="8" />
	<text class="label" x="594" y="208" text-anchor="middle">CatalogApi</text>
	<text class="note" x="594" y="226" text-anchor="middle">open host service</text>
	<path class="link" d="M 594 188 L 594 94" marker-end="url(#pl-flow-arrow)" />
	<text class="note" x="604" y="145">calls</text>
</svg>
</div>

::: tip
Inside a context, use the objects of the domain: aggregates, value objects, identifiers. The
published language exists only where a context meets another one.
:::

## API

```ts
import type { PublishedLanguage } from "@alveolus/core";
// or: import type { PublishedLanguage } from
//   "@alveolus/core/published-language";
```

### Type parameters

```ts
type PublishedLanguage<Representation extends JsonValue> =
	Representation;
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Representation` | The JSON shape of what is exchanged. | extends `JsonValue` |

### `PublishedLanguage<Representation>` <Badge type="info" text="type" /> <Badge type="tip" text="you write it" />

```ts
type ProductRepresentation = PublishedLanguage<{
	readonly id: string;
	readonly name: string;
}>;
```

Wraps one representation and checks at compile time that it is JSON. It returns the same type.

### `JsonValue` <Badge type="info" text="type" />

```ts
type JsonValue =
	| string
	| number
	| boolean
	| null
	| readonly JsonValue[]
	| { readonly [key: string]: JsonValue };
```

Any JSON value: string, number, boolean, `null`, and arrays and objects of them. It is the
constraint of `Representation`.

::: warning Caveats
- `PublishedLanguage` changes nothing at runtime: the type is the JSON type it wraps.
- Declare representations with `type`, not `interface`: an interface does not satisfy the index
  signature of `JsonValue`.
- Files in `published-language/` import only their own published language, the published-language
  types of core (`PublishedLanguage`, `JsonValue`, `IntegrationEvent`, `AnyIntegrationEvent`) and
  packages such as a schema library: see [`layers/no-outward-import`](../../rules/layers/no-outward-import.md).
:::

## Usage

Build the contract the catalog publishes and the copy ordering reads, one idea at a time. Each step
shows the whole file: added lines are highlighted.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-find-what-crosses-the-boundary">Find what crosses the boundary</a></span>Start from what others need.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-what-you-publish">Declare what you publish</a></span>A JSON type, in its own folder.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-write-values-as-plain-json">Write values as plain JSON</a></span>No value object crosses.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-redeclare-what-you-read">Redeclare what you read</a></span>Downstream keeps its own copy.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-use-it-on-both-sides">Use it on both sides</a></span>Answer with one, read with the other.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Find what crosses the boundary

Ordering needs the price of a product, and the catalog owns products: the catalog publishes them
through its [open host service](./open-host-services.md).

### 2. Declare what you publish

So that other contexts get a contract and not the model, the catalog declares the shape it sends
in `published-language/`, with `PublishedLanguage`. Identifiers are written as raw strings.

```ts [src/catalog/published-language/product.representation.ts]
import type { PublishedLanguage } from "@alveolus/core";

export type ProductRepresentation = PublishedLanguage<{
	readonly id: string;
	readonly name: string;
}>;
```

### 3. Write values as plain JSON

A `Money` is a class of the catalog's model: it is sent as plain fields. `PublishedLanguage` only
accepts JSON values, so a class, a `Date` or `undefined` does not compile.

```ts [src/catalog/published-language/product.representation.ts]
import type { PublishedLanguage } from "@alveolus/core";

export type ProductRepresentation = PublishedLanguage<{
	readonly id: string;
	readonly name: string;
	readonly price: { // [!code ++]
		readonly amount: number; // [!code ++]
		readonly currency: string; // [!code ++]
	}; // [!code ++]
}>;
```

### 4. Redeclare what you read

Ordering does not import the catalog's type: it redeclares, in its own `published-language/`, only
the fields it reads. The catalog may add fields without touching ordering.

```ts [src/ordering/published-language/catalog-product.representation.ts]
import type { PublishedLanguage } from "@alveolus/core";

export type CatalogProductRepresentation = PublishedLanguage<{
	readonly id: string;
	readonly price: {
		readonly amount: number;
		readonly currency: string;
	};
}>;
```

### 5. Use it on both sides

The open host service of the catalog answers with the first type; the
[anti-corruption layer](./anti-corruption-layers.md) of ordering reads the answer as the second,
and TypeScript checks that both shapes still match.

```ts [src/catalog/driving/in-process/catalog-api.ts]
async productById(
	productId: string,
): Promise<ProductRepresentation | undefined> {
```

```ts [src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
const product: CatalogProductRepresentation | undefined =
	await this.catalog.productById(productId.value);
```

### 6. Check it

Run the checks. Two rules keep the published language a contract:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a></span>No context imports the published language of another: it redeclares it.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-outward-import"><code>layers/no-outward-import</code></a></span>The published language imports only published-language types.</div>
</div>

Importing the catalog's type instead of redeclaring it is reported:

```
src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts
  8  strategic/no-cross-context-import: Imports the published language
  of catalog: redeclare the fields you read in your own
  published-language/.
```

## Troubleshooting

**`Type '…' does not satisfy the constraint 'JsonValue'`**: the representation holds something that
is not JSON (a `Date`, a class instance, a function), or it is declared with `interface`. Convert the
value to JSON, or declare the shape with `type`.

## See also

- [Open host services](./open-host-services.md), which answer in the published language
- [Anti-corruption layers](./anti-corruption-layers.md), which read it
- [Integration events](../application/integration-events.md), the events in the published language
- [Project layout: bounded contexts](../../guide/project-layout.md#bounded-contexts)
- Rules: [`strategic/no-cross-context-import`](../../rules/strategic/no-cross-context-import.md), [`layers/no-outward-import`](../../rules/layers/no-outward-import.md)
