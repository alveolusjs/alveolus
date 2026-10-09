---
description: "Architecture rule: a bounded context is reached only through its open host service, from an anti-corruption layer or its composition root."
---

# no-cross-context-import

A bounded context is closed: another context reaches it only through its open host service, from
an anti-corruption layer or its composition root.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>strategic/no-cross-context-import</code></dd>
	<dt>Category</dt><dd><a href="/rules/#strategic">Strategic</a>: what crosses a bounded context</dd>
	<dt>Reports</dt><dd>An import from another bounded context that is not its open host service, used where it may be; a value of another context given in the wiring that is not its open host service; an import of a file the analysis does not see</dd>
	<dt>Applies to</dt><dd>Every file of every bounded context, whatever its subdomain, and of the shared kernel</dd>
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
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Only from an anti-corruption layer</span>In a core context, the importing file declares a class that implements <code>AntiCorruptionLayer</code>, or is the composition root of its context. A <a href="../../guide/project-layout.md#core-supporting-generic">supporting or generic context</a> calls the service from anywhere: it has no model to protect.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Composition roots meet freely</span>A composition root may import another context's composition root, to reach its open host services. It re-exports nothing, so that no other context reaches its model through it.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span>No foreign published language</span>The published language of another context is never imported, not even its types.</div>
</div>

The shared kernel imports no bounded context at all. Every context may import the shared kernel.

No file of a context or of the shared kernel imports a file the analysis does not see: ignored,
unresolved, computed at runtime, or outside the declared contexts and the shared kernel. Such a
file could re-export another context, and the rule could not tell which one. Code loaded at
runtime, with `createRequire`, `eval`, the `Function` constructor or `node:vm`, is reported the
same way, whether it is named or reached through its type, see
[Every import counts](../index.md#every-import-counts).

Every form of import counts, see [Every import counts](../index.md#every-import-counts).

The global object is no channel either. Writing or reading a name of `globalThis`, `global`,
`window` or `self` that no file declares is reported, wherever it is written: an assignment,
`Reflect.set`, `Reflect.get`, `Object.assign`, `Object.defineProperty`, or `(globalThis as any).x`.
A name the library declares, such as a polyfill of `globalThis.crypto` or a read of `fetch`, is
fine, and a global the project declares with `declare global` counts as an import of the file that
declares it.

The wiring follows the same contract. In the composition roots and the files at the root of
`src/`, a value of one context given to another one, such as
`new OrderingModule({ prices: () => this.catalog.commands.changePrice })`, is an
`OpenHostService` of the giving context, or one of its methods. A handler, a repository or any
other class of its model is reported, even when the receiving side declares a type of the same
shape. Whether the receiving context may consume the giving one at all is checked by
[`strategic/no-unmapped-context`](./no-unmapped-context.md).

So that what crosses can be seen, a module of another context is read by its properties
(`this.catalog.api`), or handed whole to the constructor of another module
(`new OrderingModule(this.catalog)`). Any other way into it is reported: brackets
(`this.catalog["commands"]`), `Reflect.get`, a spread, destructuring, or passing it to a function,
such as a helper of `src/` or `get` from lodash, that could hand back anything.

## What it reports

```
src/ordering/driven/pg/adapters/stock.adapter.ts
  1  error  strategic/no-cross-context-import: Imports
  src/catalog/domain/aggregates/product.aggregate.ts (catalog domain):
  only an OpenHostService of another bounded context may be imported.
  2  error  strategic/no-cross-context-import: Imports the published language
  of catalog: redeclare the fields you read in your own
  published-language/.
  3  error  strategic/no-cross-context-import: Uses the open host service of
  catalog outside an AntiCorruptionLayer: translate it in an
  anti-corruption layer.

src/catalog/catalog.module.ts
  2  error  strategic/no-cross-context-import: The composition root
  re-exports Product: it exports its own module only, so that no
  other context reaches through it.

src/shared-kernel/domain/value-objects/money.value-object.ts
  1  error  strategic/no-cross-context-import: The shared kernel imports no
  bounded context, but imports
  src/catalog/domain/value-objects/currency.value-object.ts
  (catalog domain).

src/ordering/domain/services/pricing.service.ts
  1  error  strategic/no-cross-context-import: Imports
  src/ordering/domain/value-objects/product-id.fixture.ts (ignored by
  the analysis): the analysis cannot tell which bounded context it
  reaches; move the file into a bounded context or the shared kernel.

src/ordering/driven/memory/adapters/memory-prices.adapter.ts
  1  error  strategic/no-cross-context-import: Loads code at runtime with
  node:module: the analysis cannot tell which bounded context it
  reaches; use a static import.

src/app.module.ts
 14  error  strategic/no-cross-context-import: Gives
  this.catalog.commands.changePrice, from catalog, to ordering: only an
  OpenHostService of another bounded context may cross, in an import or
  in the wiring.
 21  error  strategic/no-cross-context-import: Reaches into this.catalog
  with Reflect.get: in the wiring, a module of another context is read
  by its properties, so that what crosses can be seen.

src/catalog/catalog.module.ts
 18  error  strategic/no-cross-context-import: Writes
  globalThis.catalog:prices, which no file declares: two contexts can
  meet there without the context map showing it. Integrate through an
  open host service, or publish an integration event.
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

## Limits

::: warning What the rule cannot see
- The rule checks what an anti-corruption layer imports, not what it does with it: an adapter that
  returns the open host service's answer as is, untranslated, is accepted. In review, the ACL
  should build values of its own context.
- A file that matches `ignore` in `alveolus.config.ts` is not analysed at all, and no file of a
  context may import it. Review a change to `ignore` as you would review a rule turned off.
- A loader reached through a value typed `any` that is neither a `constructor` nor a lookup on
  `globalThis`, such as `(loaders as any).run(code)`, is not recognised. In review, `any` around a
  call is a question to ask.
- In the wiring, a module chosen by a condition (`flag ? this.catalog : this.ordering`) and then
  reached into is not recognised as a module: its type is a union.
- In the wiring, a value whose type is erased on the way, by a cast or a container token written
  as a string, is not seen. In review, the composition root holds no cast.
:::

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
