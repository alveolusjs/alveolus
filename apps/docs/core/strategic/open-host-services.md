# Open host services

An open host service is the documented entry point of a bounded context: the class other contexts
call, answering in the [published language](./published-language.md), never with objects of the
domain. It is the only class another context may import.

```ts [src/catalog/driving/in-process/catalog-api.ts]
import type { OpenHostService } from "@alveolus/core";

export class CatalogApi implements OpenHostService {
	async productById(productId: string): Promise<ProductRepresentation | undefined> { … }
}
```

## When to use

Write one when other bounded contexts or services need to ask yours something, whatever the
transport: a class called in the same process, an HTTP API, an RPC endpoint. When your context only
tells the others what happened, publishing [integration events](../application/integration-events.md)
is enough.

## Usage

### Expose a class in the same process

In a modular monolith, the open host service is a class of `driving/`. It calls the application
and maps what it reads to the published language.

```ts [src/catalog/driving/in-process/catalog-api.ts]
import type { OpenHostService } from "@alveolus/core";

import { GetProductHandler } from "../../application/queries/get-product.query";
import type { ProductRepresentation } from "../../published-language/product.representation";

export class CatalogApi implements OpenHostService {
	constructor(private readonly getProduct: GetProductHandler) {}

	async productById(productId: string): Promise<ProductRepresentation | undefined> {
		const product = await this.getProduct.handle({ productId });
		if (!product.ok) {
			return undefined;
		}
		const { id, name, price } = product.value;
		return { id: id.value, name, price: { amount: price.amount, currency: price.currency } };
	}
}
```

Other contexts import this class, and only this class, from an
[anti-corruption layer](./anti-corruption-layers.md).

### Wire it in the composition root

The composition root of the bounded context builds its open host services and exposes them, and
nothing else. The composition root of the downstream context receives them to build its
anti-corruption layers.

```ts [src/catalog/catalog.module.ts]
export class CatalogModule {
	readonly api: CatalogApi;

	constructor(db: Pool) {
		this.api = new CatalogApi(new GetProductHandler(new PgProducts(db)));
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

Exposing a repository or a handler would let another context reach the model behind the open host
service. With NestJS, the module exports the open host service only: see
[NestJS](../../integrations/nestjs.md#connect-two-bounded-contexts).

### Expose it over HTTP

The same role fits a controller: it implements `OpenHostService` and answers with a
representation. The routes are written with your HTTP framework; see
[Integrations](../../integrations/index.md).

```ts [src/catalog/driving/http/controllers/products.controller.ts]
import type { OpenHostService } from "@alveolus/core";

import type { CatalogApi } from "../../in-process/catalog-api";

export class ProductsController implements OpenHostService {
	constructor(private readonly catalog: CatalogApi) {}

	async product(productId: string) {
		const product = await this.catalog.productById(productId);
		if (product === undefined) {
			return { status: 404, body: { error: "ProductNotFound", productId } };
		}
		return { status: 200, body: product };
	}
}
```

The catalog can then move to its own service: the HTTP contract is already the published language.

### Answer in the published language

<div class="al-compare">

```ts [❌ Avoid]
async productById(productId: string): Promise<Product | undefined> {
	return this.products.findById(new ProductId(productId));
}
```

```ts [✅ Prefer]
async productById(productId: string): Promise<ProductRepresentation | undefined> {
	const product = await this.getProduct.handle({ productId });
	return product.ok ? this.toRepresentation(product.value) : undefined;
}
```

</div>

::: details Why?
An open host service that returns an aggregate hands the model to every caller: they start
depending on its methods and fields, and the catalog can no longer change them. The representation
is the contract; the model stays behind it.
:::

## Reference

```ts
abstract class OpenHostService
```

`OpenHostService` has no members. Apply it with `implements`, so the class stays free to extend
something else: it marks the class as the documented entry point of its bounded context.

**Caveats**

- It is the only class another bounded context may import, and only from an anti-corruption layer
  or from its composition root: see [`bc-isolation`](../../rules/bc-isolation.md).
- It lives in `driving/`, under the name of its technology: see
  [`placement`](../../rules/placement.md).
- Type what it returns with a representation, even inside an HTTP response: the representation is
  the contract.

Import from `@alveolus/core` or `@alveolus/core/open-host-services`.

## See also

- [Published Language](./published-language.md), what it answers in
- [Anti-corruption layers](./anti-corruption-layers.md), how another context reads it
- [Project layout: bounded contexts](../../guide/project-layout.md#bounded-contexts)
- [`bc-isolation`](../../rules/bc-isolation.md)
