# bc-isolation

A bounded context is closed. The only way into it is its **open host service**, and the only place
allowed to use it is an **anti-corruption layer** of the other context, or that context's
composition root. Nothing else crosses the boundary.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/driven/pg/adapters/stock.adapter.ts]
import type { Product } from "../../../../catalog/domain/aggregates/product.aggregate";
import type { ProductRepresentation } from "../../../../catalog/published-language/product.representation";
```

```ts [✅ Prefer: src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
import type { AntiCorruptionLayer } from "@alveolus/core";

import type { CatalogApi } from "../../../../catalog/driving/nestjs/catalog-api";
import { PriceList } from "../../../domain/ports/price-list.port";

export class CatalogPriceList extends PriceList implements AntiCorruptionLayer {
	constructor(private readonly catalog: CatalogApi) {
		super();
	}
}
```

</div>

## What it checks

When a file of one bounded context imports a file of another one:

- the imported names must all be classes that implement `OpenHostService`;
- the importing file must declare a class that implements `AntiCorruptionLayer`, or be the
  composition root of its context;
- a composition root may also import another context's composition root, for instance a NestJS
  module importing the module that exports an open host service;
- the published language of another context is never imported, not even its types.

The shared kernel imports no bounded context at all. Every context may import the shared kernel.

## Why

Two contexts that import each other's classes share one model without saying so: renaming a field
in the catalog breaks ordering. Going through an open host service and an anti-corruption layer
gives one entry point on one side, one translation on the other, and everything in between is
free to change.

The downstream context redeclares the fields it reads in its own `published-language/`, instead
of importing the upstream types. When the open host service is called in the same process,
TypeScript still checks that both shapes match, at the anti-corruption layer and nowhere else.

## What it reports

```
src/ordering/driven/pg/adapters/stock.adapter.ts:1
  bc-isolation: Imports src/catalog/domain/aggregates/product.aggregate.ts (catalog domain): only an OpenHostService of another bounded context may be imported.

src/ordering/driven/pg/adapters/stock.adapter.ts:2
  bc-isolation: Imports the published language of catalog: redeclare the fields you read in your own published-language/.
```

An open host service imported by a class that is not an anti-corruption layer reports
`Uses the open host service of catalog outside an AntiCorruptionLayer`.

## Turn it off

```ts
rules: { "bc-isolation": "off" }
```

## See also

- [Project layout: bounded contexts](../guide/project-layout.md#bounded-contexts)
- [`layer-direction`](./layer-direction.md), for dependencies inside a context
