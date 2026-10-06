---
description: "Anti-corruption layers in Domain-Driven Design with TypeScript: translate another bounded context into your own language so its model never leaks in."
---

# Anti-corruption layers

An anti-corruption layer is the adapter that reads another bounded context and translates it into
the language of yours, so that the foreign model never enters your domain or your application.

<dl class="al-glance">
	<dt>Layer</dt><dd>Driven, or driving for a consumer</dd>
	<dt>File</dt><dd><code>src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts</code></dd>
	<dt>Implements</dt><dd><a href="#api"><code>AntiCorruptionLayer</code></a>, and extends your <a href="/core/domain/ports">port</a></dd>
	<dt>Called by</dt><dd><a href="/core/application/command-handlers">Command handlers</a>, through the port</dd>
	<dt>Checked by</dt><dd><a href="/rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a>, <a href="/rules/layers/no-portless-adapter"><code>layers/no-portless-adapter</code></a>, <a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></dd>
</dl>

## Why

Before adding a line to an order, ordering checks that the product has a price in the catalog. If
the handler calls `CatalogApi` directly, the catalog's representations spread into the use case,
then into the domain. Every change in the catalog becomes a change in ordering, and the order
starts speaking the catalog's language.

::: tip The fix
One adapter, and only one, touches the catalog. Ordering asks for what it needs in its own words,
through a [port](../domain/ports.md); the anti-corruption layer calls the catalog, reads its JSON
and answers with ordering's objects.
:::

## How it works

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>The domain states its need</span>The <code>PriceList</code> port asks for the price of a <code>ProductId</code>, as <code>Money</code>. It never mentions the catalog.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>The adapter calls the other context</span><code>CatalogPriceList</code> calls the <a href="/core/strategic/open-host-services">open host service</a> and reads its <a href="/core/strategic/published-language">published language</a>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>It answers with your objects</span>It turns the JSON into <code>Money</code>. Representations come in; they never go out.</div>
</div>

## Where it fits

The anti-corruption layer is the ordering side of the meeting point. The handler only sees the
port; the adapter is the one place that knows the catalog exists.

<div class="al-diagram">
<svg viewBox="0 0 720 260" role="img" aria-label="In ordering, AddLineHandler asks the PriceList port for a price. CatalogPriceList, the anti-corruption layer, extends the port and reads the JSON answered by CatalogApi, the open host service of catalog, which calls GetProductHandler.">
	<defs>
		<marker id="acl-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
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
	<rect class="boundary" x="24" y="188" width="240" height="48" rx="8" />
	<text class="label" x="144" y="208" text-anchor="middle">CatalogPriceList</text>
	<text class="note" x="144" y="226" text-anchor="middle">anti-corruption layer</text>
	<path class="link" d="M 144 92 L 144 114" marker-end="url(#acl-flow-arrow)" />
	<path class="link" d="M 144 188 L 144 166" marker-end="url(#acl-flow-arrow)" />
	<text class="note" x="154" y="181">extends</text>
	<rect class="box" x="300" y="188" width="156" height="48" rx="8" />
	<text class="label" x="378" y="208" text-anchor="middle">JSON</text>
	<text class="note" x="378" y="226" text-anchor="middle">the contract</text>
	<path class="link" d="M 300 212 L 266 212" marker-end="url(#acl-flow-arrow)" />
	<path class="link" d="M 492 212 L 458 212" marker-end="url(#acl-flow-arrow)" />
	<rect class="box" x="476" y="8" width="236" height="244" rx="14" />
	<text class="note" x="492" y="30">src/catalog/</text>
	<rect class="box" x="492" y="44" width="204" height="48" rx="8" />
	<text class="label" x="594" y="64" text-anchor="middle">GetProductHandler</text>
	<text class="note" x="594" y="82" text-anchor="middle">reads the catalog</text>
	<rect class="box" x="492" y="188" width="204" height="48" rx="8" />
	<text class="label" x="594" y="208" text-anchor="middle">CatalogApi</text>
	<text class="note" x="594" y="226" text-anchor="middle">open host service</text>
	<path class="link" d="M 594 188 L 594 94" marker-end="url(#acl-flow-arrow)" />
	<text class="note" x="604" y="145">calls</text>
</svg>
</div>

::: tip
If the catalog moves behind HTTP, only the anti-corruption layer changes: it fetches and validates
the JSON instead of calling `CatalogApi`. The port, the handler and the domain stay the same.
:::

## API

```ts
import type { AntiCorruptionLayer } from "@alveolus/core";
// or: import type { AntiCorruptionLayer } from
//   "@alveolus/core/anti-corruption-layers";
```

### `AntiCorruptionLayer` <Badge type="info" text="abstract · no members" /> <Badge type="tip" text="you implement it" />

```ts
abstract class AntiCorruptionLayer {}
```

Marks the class as the translator of another context. It has no members: the class declares its
role with `implements`, and the rules recognise it.

```ts
export class CatalogPriceList
	extends PriceList
	implements AntiCorruptionLayer { … }
```

### The methods of the port <Badge type="tip" text="you implement them" />

```ts
async priceOf(productId: ProductId): Promise<Money | undefined>
```

For a driven anti-corruption layer: the methods of the [port](../domain/ports.md) it extends,
such as `priceOf` of `PriceList`. Each one calls the other context, reads its representation and
returns your objects. Your handlers call them through the port, in your language.

### `consume(event)` <Badge type="info" text="any name" /> <Badge type="tip" text="called by your message broker" />

```ts
async consume(event: OrderPlacedRepresentation): Promise<void>
```

For a driving anti-corruption layer: receives an event of the other context, in its published
language, and turns it into one of your commands.

::: warning Caveats
- Use `implements`, not `extends`: a driven anti-corruption layer already extends its port.
- It is the only place, with the composition root, that may import another bounded context: see
  [`strategic/no-cross-context-import`](../../rules/strategic/no-cross-context-import.md).
- A driven anti-corruption layer is placed like any adapter, in `driven/<context>/adapters/`; a
  consumer goes in `driving/`: see [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md).
:::

## Usage

Build the anti-corruption layer through which ordering reads prices from the catalog, one idea at a
time. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-declare-what-your-context-needs">Declare what your context needs</a></span>Name the need in your own words.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-adapter">Declare the adapter</a></span>One class at the boundary.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-ask-the-other-context">Ask the other context</a></span>Call its open host service.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-type-the-answer-in-your-own-words">Type the answer in your own words</a></span>Redeclare what you read.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-translate-into-your-model">Translate into your model</a></span>Answer with your objects.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-wire-it">Wire it</a></span>Hand it the open host service.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">7</span><a href="#_7-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Declare what your context needs

The domain of ordering asks for prices through its own [port](../domain/ports.md), `PriceList`,
with an abstract `priceOf(productId)` that returns a `Money` or `undefined`.

### 2. Declare the adapter

So that the rest of ordering never learns the catalog exists, one driven adapter extends the port
and implements `AntiCorruptionLayer`. It receives `CatalogApi`, the open host service of the
catalog, in its constructor.

```ts [src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
import type { AntiCorruptionLayer } from "@alveolus/core";

import { CatalogApi } from
	"../../../../catalog/driving/in-process/catalog-api";
import { PriceList } from "../../../domain/ports/price-list.port";

export class CatalogPriceList
	extends PriceList
	implements AntiCorruptionLayer
{
	constructor(private readonly catalog: CatalogApi) {
		super();
	}
}
```

TypeScript now asks for `priceOf`: the next step adds it.

### 3. Ask the other context

The adapter calls the catalog in the catalog's terms: a raw string id, and `undefined` when the
product does not exist. Ordering's `ProductId` stays on this side.

```ts [src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
import type { AntiCorruptionLayer } from "@alveolus/core";

import { CatalogApi } from
	"../../../../catalog/driving/in-process/catalog-api";
import { Money } from // [!code ++]
	"../../../../shared-kernel/domain/value-objects/money.value-object"; // [!code ++]
import { PriceList } from "../../../domain/ports/price-list.port";
import type { ProductId } from // [!code ++]
	"../../../domain/value-objects/product-id.identifier"; // [!code ++]

export class CatalogPriceList
	extends PriceList
	implements AntiCorruptionLayer
{
	constructor(private readonly catalog: CatalogApi) {
		super();
	}

	async priceOf(productId: ProductId): Promise<Money | undefined> { // [!code ++]
		const product = // [!code ++]
			await this.catalog.productById(productId.value); // [!code ++]
		if (product === undefined) { // [!code ++]
			return undefined; // [!code ++]
		} // [!code ++]
	} // [!code ++]
}
```

### 4. Type the answer in your own words

So that a change in the catalog breaks the build instead of production, the answer is typed with
ordering's own [published language](./published-language.md): `CatalogProductRepresentation`
redeclares the fields ordering reads.

```ts [src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
import type { AntiCorruptionLayer } from "@alveolus/core";

import { CatalogApi } from
	"../../../../catalog/driving/in-process/catalog-api";
import { Money } from
	"../../../../shared-kernel/domain/value-objects/money.value-object";
import { PriceList } from "../../../domain/ports/price-list.port";
import type { ProductId } from
	"../../../domain/value-objects/product-id.identifier";
import type { CatalogProductRepresentation } from // [!code ++]
	"../../../published-language/catalog-product.representation"; // [!code ++]

export class CatalogPriceList
	extends PriceList
	implements AntiCorruptionLayer
{
	constructor(private readonly catalog: CatalogApi) {
		super();
	}

	async priceOf(productId: ProductId): Promise<Money | undefined> {
		const product = // [!code --]
		const product: CatalogProductRepresentation | undefined = // [!code ++]
			await this.catalog.productById(productId.value);
		if (product === undefined) {
			return undefined;
		}
	}
}
```

### 5. Translate into your model

The domain expects a `Money`, not JSON: the adapter builds the `Currency`, then the `Money`, with
the factories of the value objects, chained by `andThen`. An invalid price is a broken contract,
not a business failure, so the adapter throws.

```ts [src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
import type { AntiCorruptionLayer } from "@alveolus/core"; // [!code --]
import { type AntiCorruptionLayer, andThen } from "@alveolus/core"; // [!code ++]

import { CatalogApi } from
	"../../../../catalog/driving/in-process/catalog-api";
import { Currency } from // [!code ++]
	"../../../../shared-kernel/domain/value-objects/currency.value-object";// [!code ++]
import { Money } from
	"../../../../shared-kernel/domain/value-objects/money.value-object";
import { PriceList } from "../../../domain/ports/price-list.port";
import type { ProductId } from
	"../../../domain/value-objects/product-id.identifier";
import type { CatalogProductRepresentation } from
	"../../../published-language/catalog-product.representation";

export class CatalogPriceList
	extends PriceList
	implements AntiCorruptionLayer
{
	constructor(private readonly catalog: CatalogApi) {
		super();
	}

	async priceOf(productId: ProductId): Promise<Money | undefined> {
		const product: CatalogProductRepresentation | undefined =
			await this.catalog.productById(productId.value);
		if (product === undefined) {
			return undefined;
		}
		const { amount, currency } = product.price; // [!code ++]
		const price = andThen(Currency.of(currency), (code) => // [!code ++]
			Money.of(amount, code), // [!code ++]
		); // [!code ++]
		if (!price.ok) { // [!code ++]
			const reason = price.error.type; // [!code ++]
			throw new Error( // [!code ++]
				`The catalog sent an invalid price: ${reason}`, // [!code ++]
			); // [!code ++]
		} // [!code ++]
		return price.value; // [!code ++]
	}
}
```

### 6. Wire it

The composition root of ordering receives the catalog's module and builds the adapter with its open
host service. The handlers only see `PriceList`.

```ts [src/ordering/ordering.module.ts]
export class OrderingModule {
	constructor(db: Pool, catalog: CatalogModule) {
		const prices = new CatalogPriceList(catalog.api);
		…
	}
}
```

### 7. Check it

Run the checks. Three rules keep the boundary where it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a></span>Only the anti-corruption layer may use the open host service of another context.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-portless-adapter"><code>layers/no-portless-adapter</code></a></span>The adapter extends a port declared by the domain.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></span>It stays in <code>driven/&lt;technology&gt;/adapters/*.adapter.ts</code>.</div>
</div>

A handler that calls the catalog directly is reported:

```
src/ordering/application/commands/place-order.command.ts:3
  strategic/no-cross-context-import: Uses the open host service of
  catalog outside an AntiCorruptionLayer: translate it in an
  anti-corruption layer.
```

## See also

- [Open host services](./open-host-services.md), what a driven anti-corruption layer calls
- [Published Language](./published-language.md), what it reads
- [Ports](../domain/ports.md), what a driven anti-corruption layer extends
- [Project layout: bounded contexts](../../guide/project-layout.md#bounded-contexts)
- Rules: [`strategic/no-cross-context-import`](../../rules/strategic/no-cross-context-import.md), [`layers/no-portless-adapter`](../../rules/layers/no-portless-adapter.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
