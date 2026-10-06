---
description: "Architecture rule: a bounded context is reached only through its open host service, from an anti-corruption layer or its composition root."
---

# no-cross-context-import

A bounded context is closed: another context reaches it only through its open host service, from
an anti-corruption layer or its composition root.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>strategic/no-cross-context-import</code></dd>
	<dt>Category</dt><dd><a href="/rules/#strategic">Strategic</a>: what crosses a bounded context</dd>
	<dt>Reports</dt><dd>An import from another bounded context that is not its open host service, used where it may be</dd>
	<dt>Applies to</dt><dd>Every file of every bounded context and of the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"strategic/no-cross-context-import": "off"</code></a></dd>
</dl>

## Why

An adapter of ordering imports `Product` from the catalog domain, because it had the fields it
needed. The two contexts now share one model without anyone deciding it: renaming a field in the
catalog breaks ordering, and nothing showed the dependency until it broke.

::: tip The fix
One door on each side. The catalog exposes an
[open host service](../../core/strategic/open-host-services.md); ordering calls it from an
[anti-corruption layer](../../core/strategic/anti-corruption-layers.md) that translates the answer
into its own model. Everything in between is free to change.
:::

## What it checks

When a file of one bounded context imports a file of another one:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Only open host services</span>Every imported name is a class that implements <code>OpenHostService</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Only from an anti-corruption layer</span>The importing file declares a class that implements <code>AntiCorruptionLayer</code>, or is the composition root of its context.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Composition roots meet freely</span>A composition root may import another context's composition root, to reach its open host services.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span>No foreign published language</span>The published language of another context is never imported, not even its types.</div>
</div>

The shared kernel imports no bounded context at all. Every context may import the shared kernel.

## What it reports

```
src/ordering/driven/pg/adapters/stock.adapter.ts:1
  strategic/no-cross-context-import: Imports
  src/catalog/domain/aggregates/product.aggregate.ts (catalog domain):
  only an OpenHostService of another bounded context may be imported.

src/ordering/driven/pg/adapters/stock.adapter.ts:2
  strategic/no-cross-context-import: Imports the published language
  of catalog: redeclare the fields you read in your own
  published-language/.

src/ordering/driven/pg/adapters/stock.adapter.ts:3
  strategic/no-cross-context-import: Uses the open host service of
  catalog outside an AntiCorruptionLayer: translate it in an
  anti-corruption layer.

src/shared-kernel/domain/value-objects/money.value-object.ts:1
  strategic/no-cross-context-import: The shared kernel imports no
  bounded context, but imports
  src/catalog/domain/value-objects/currency.value-object.ts
  (catalog domain).
```

## Fix it

### Go through an anti-corruption layer

So that only one class knows the other context exists, declare in your domain a port that asks in
your own words, and implement it in an anti-corruption layer that calls the open host service.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/driven/pg/adapters/stock.adapter.ts]
import type { Product } from "../../../../catalog/domain/aggregates/product.aggregate";
import type { ProductRepresentation } from "../../../../catalog/published-language/product.representation";
```

```ts [✅ Prefer: src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
import type { AntiCorruptionLayer } from "@alveolus/core";

import type { CatalogApi } from "../../../../catalog/driving/in-process/catalog-api";
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

</div>

### Redeclare the fields you read

So that the upstream context can change its published language without breaking yours, the
downstream context redeclares the fields it reads in its own `published-language/`, instead of
importing the upstream types. When the open host service is called in the same process,
TypeScript still checks that both shapes match, at the anti-corruption layer and nowhere else.

### Keep the shared kernel independent

So that a change in one context never reaches all the others, the shared kernel imports no
bounded context. Move what it needs into the shared kernel, or keep it in the context that owns it.

## Turn it off

```ts [alveolus.config.ts]
rules: { "strategic/no-cross-context-import": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new code keeps the boundaries while you remove the old shortcuts.

## See also

- [Project layout: bounded contexts](../../guide/project-layout.md#bounded-contexts)
- [Open host services](../../core/strategic/open-host-services.md) and
  [Anti-corruption layers](../../core/strategic/anti-corruption-layers.md)
- [`layers/no-outward-import`](../layers/no-outward-import.md), for dependencies inside a context
- [Rules](../index.md), every rule by category
