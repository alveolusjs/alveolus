# Open host services

An open host service is the documented entry point of a bounded context: the one class other
contexts may call, answering in the [published language](./published-language.md).

<dl class="al-glance">
	<dt>Layer</dt><dd>Driving</dd>
	<dt>File</dt><dd><code>src/catalog/driving/in-process/catalog-api.ts</code></dd>
	<dt>Implements</dt><dd><a href="#api"><code>OpenHostService</code></a></dd>
	<dt>Called by</dt><dd><a href="/core/strategic/anti-corruption-layers">Anti-corruption layers</a> of other contexts</dd>
	<dt>Checked by</dt><dd><a href="/rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a>, <a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></dd>
</dl>

## Why

Ordering needs the price of a product. Without a declared entry point, it imports whatever it finds
in the catalog: a repository here, a query handler there, the `Product` aggregate itself. The
catalog now has entry points nobody chose, and cannot change any of them without breaking ordering.

::: tip The fix
The catalog opens one door: `CatalogApi`. It is the only class other contexts may import, it says
what the catalog offers, and it answers in JSON. Everything behind it stays free to change.
:::

## How it works

An open host service is a class of `driving/`, like a controller: it receives a request, calls the
application of its own context and answers. It marks itself with `implements OpenHostService`.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Receive plain values</span>The caller passes strings and numbers, never objects of the catalog domain.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Call the application</span>It calls a <a href="/core/application/query-handlers">query</a> or <a href="/core/application/command-handlers">command handler</a> of its own context. The rules stay there.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Answer in the published language</span>It maps the result to a representation: JSON, never an aggregate.</div>
</div>

## Where it fits

The open host service is the catalog side of the meeting point. On the ordering side, an
[anti-corruption layer](./anti-corruption-layers.md) calls it and translates its answer.

<div class="al-diagram">
<svg viewBox="0 0 720 260" role="img" aria-label="In ordering, AddLineHandler asks the PriceList port for a price. CatalogPriceList, the anti-corruption layer, extends the port and reads the JSON answered by CatalogApi, the open host service of catalog, which calls GetProductHandler.">
	<defs>
		<marker id="ohs-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
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
	<path class="link" d="M 144 92 L 144 114" marker-end="url(#ohs-flow-arrow)" />
	<path class="link" d="M 144 188 L 144 166" marker-end="url(#ohs-flow-arrow)" />
	<text class="note" x="154" y="181">extends</text>
	<rect class="box" x="300" y="188" width="156" height="48" rx="8" />
	<text class="label" x="378" y="208" text-anchor="middle">JSON</text>
	<text class="note" x="378" y="226" text-anchor="middle">the contract</text>
	<path class="link" d="M 300 212 L 266 212" marker-end="url(#ohs-flow-arrow)" />
	<path class="link" d="M 492 212 L 458 212" marker-end="url(#ohs-flow-arrow)" />
	<rect class="box" x="476" y="8" width="236" height="244" rx="14" />
	<text class="note" x="492" y="30">src/catalog/</text>
	<rect class="box" x="492" y="44" width="204" height="48" rx="8" />
	<text class="label" x="594" y="64" text-anchor="middle">GetProductHandler</text>
	<text class="note" x="594" y="82" text-anchor="middle">reads the catalog</text>
	<rect class="boundary" x="492" y="188" width="204" height="48" rx="8" />
	<text class="label" x="594" y="208" text-anchor="middle">CatalogApi</text>
	<text class="note" x="594" y="226" text-anchor="middle">open host service</text>
	<path class="link" d="M 594 188 L 594 94" marker-end="url(#ohs-flow-arrow)" />
	<text class="note" x="604" y="145">calls</text>
</svg>
</div>

::: tip
The open host service does not know who calls it. It describes what the catalog offers, in the
catalog's words; each caller translates on its own side.
:::

## API

```ts
import type { OpenHostService } from "@alveolus/core";
// or: import type { OpenHostService } from
//   "@alveolus/core/open-host-services";
```

### `OpenHostService` <Badge type="info" text="abstract · no members" /> <Badge type="tip" text="you implement it" />

```ts
abstract class OpenHostService {}
```

Marks the class as the entry point of its context. It has no members: the class declares its role
with `implements`, and the rules recognise it.

```ts
export class CatalogApi implements OpenHostService { … }
```

### Your methods <Badge type="tip" text="called by anti-corruption layers" />

```ts
async productById(
	productId: string,
): Promise<ProductRepresentation | undefined>
```

Named after what the context offers, such as `productById`. They take plain values and answer in
the published language, never with the classes of the model. Anti-corruption layers of other
contexts call them.

### The class itself <Badge type="tip" text="passed by the composition root" />

```ts
new CatalogPriceList(catalog.api)
```

The composition root of a downstream context receives the open host service and passes it to the
anti-corruption layers it builds.

::: warning Caveats
- It is the only class another bounded context may import, and only from an anti-corruption layer
  or from its composition root: see [`strategic/no-cross-context-import`](../../rules/strategic/no-cross-context-import.md).
- It lives in `driving/`, under the name of its technology: see
  [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md).
- Use `implements`, not `extends`: the class stays free to extend something else, such as a base
  controller.
:::

## Usage

Build `CatalogApi`, the open host service through which other contexts read the catalog, one idea at
a time. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-decide-what-you-publish">Decide what you publish</a></span>Agree on the contract first.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-service">Declare the service</a></span>Mark the one way in.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-delegate-to-a-use-case">Delegate to a use case</a></span>Reuse the application, decide nothing.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-answer-in-the-published-language">Answer in the published language</a></span>Never hand out the model.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-wire-it">Wire it</a></span>Expose it, and nothing else.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Decide what you publish

What other contexts receive is the catalog's [published language](./published-language.md):
`ProductRepresentation`, plain JSON declared in `published-language/product.representation.ts`.

### 2. Declare the service

So that other contexts know which class they may call, the catalog declares one class under
`driving/` that implements `OpenHostService`. Nothing else of the catalog may be imported from
outside.

```ts [src/catalog/driving/in-process/catalog-api.ts]
import type { OpenHostService } from "@alveolus/core";

export class CatalogApi implements OpenHostService {}
```

### 3. Delegate to a use case

The open host service holds no rule: it calls a [query handler](../application/query-handlers.md)
that the catalog already has. It takes plain values, so callers need none of the catalog's
classes, and answers `undefined` when the product does not exist.

```ts [src/catalog/driving/in-process/catalog-api.ts]
import type { OpenHostService } from "@alveolus/core";

export class CatalogApi implements OpenHostService {} // [!code --]
import { GetProductHandler } from // [!code ++]
	"../../application/queries/get-product.query"; // [!code ++]
import type { ProductRepresentation } from // [!code ++]
	"../../published-language/product.representation"; // [!code ++]

export class CatalogApi implements OpenHostService { // [!code ++]
	constructor(private readonly getProduct: GetProductHandler) {} // [!code ++]

	async productById( // [!code ++]
		productId: string, // [!code ++]
	): Promise<ProductRepresentation | undefined> { // [!code ++]
		const product = await this.getProduct.handle({ productId }); // [!code ++]
		if (!product.ok) { // [!code ++]
			return undefined; // [!code ++]
		} // [!code ++]
	} // [!code ++]
} // [!code ++]
```

### 4. Answer in the published language

So that the catalog can change its model without breaking anyone, the service answers with plain
JSON, never with a view, an aggregate or a value object.

```ts [src/catalog/driving/in-process/catalog-api.ts]
import type { OpenHostService } from "@alveolus/core";

import { GetProductHandler } from
	"../../application/queries/get-product.query";
import type { ProductRepresentation } from
	"../../published-language/product.representation";

export class CatalogApi implements OpenHostService {
	constructor(private readonly getProduct: GetProductHandler) {}

	async productById(
		productId: string,
	): Promise<ProductRepresentation | undefined> {
		const product = await this.getProduct.handle({ productId });
		if (!product.ok) {
			return undefined;
		}
		const { id, name, price } = product.value; // [!code ++]
		return { // [!code ++]
			id: id.value, // [!code ++]
			name, // [!code ++]
			price: { amount: price.amount, currency: price.currency }, // [!code ++]
		}; // [!code ++]
	}
}
```

### 5. Wire it

The composition root of the catalog builds the service and exposes it, and nothing else. The one
of ordering receives it to build its [anti-corruption layer](./anti-corruption-layers.md).

```ts [src/catalog/catalog.module.ts]
export class CatalogModule {
	readonly api: CatalogApi;

	constructor(db: Pool) {
		const getProduct = new GetProductHandler(new PgProducts(db));
		this.api = new CatalogApi(getProduct);
	}
}
```

```ts [src/ordering/ordering.module.ts]
export class OrderingModule {
	constructor(db: Pool, catalog: CatalogModule) {
		const prices = new CatalogPriceList(catalog.api);
		…
	}
}
```

### 6. Check it

Run the checks. Two rules keep the service the only door of the catalog:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a></span>Another context imports this class, and nothing else of the catalog.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></span>It stays under <code>driving/</code>.</div>
</div>

An import that reaches past it, into the catalog's domain, is reported:

```
src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts:4
  strategic/no-cross-context-import: Imports
  src/catalog/domain/aggregates/product.aggregate.ts (catalog domain):
  only an OpenHostService of another bounded context may be imported.
```

## See also

- [Published Language](./published-language.md), what it answers in
- [Anti-corruption layers](./anti-corruption-layers.md), how another context reads it
- [Query handlers](../application/query-handlers.md), what it usually calls
- [Project layout: bounded contexts](../../guide/project-layout.md#bounded-contexts)
- Rules: [`strategic/no-cross-context-import`](../../rules/strategic/no-cross-context-import.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
