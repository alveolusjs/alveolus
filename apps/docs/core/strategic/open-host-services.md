# Open host services

An open host service is the documented entry point of a bounded context: the class other contexts
call, answering in the [published language](./published-language.md), never with objects of the
domain. It is the only class another context may import.

```ts [src/catalog/driving/nestjs/catalog-api.ts]
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

```ts [src/catalog/driving/nestjs/catalog-api.ts]
import type { OpenHostService } from "@alveolus/core";
import { Injectable } from "@nestjs/common";

import { GetProductHandler } from "../../application/queries/get-product.query";
import type { ProductRepresentation } from "../../published-language/product.representation";

@Injectable()
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

### Wire it with NestJS

The module of the bounded context exports its open host services, and nothing else. The module of
the downstream context imports it to inject the service into its anti-corruption layer.

```ts [src/catalog/catalog.module.ts]
@Module({
	exports: [CatalogApi],
	providers: [CatalogApi, GetProductHandler, { provide: Products, useClass: PgProducts }],
})
export class CatalogModule {}
```

```ts [src/ordering/ordering.module.ts]
@Module({
	imports: [CatalogModule],
	providers: [{ provide: PriceList, useClass: CatalogPriceList }],
})
export class OrderingModule {}
```

Exporting a repository or a handler would let another context reach the model behind the open
host service.

### Expose it over HTTP

The same role fits a controller: it implements `OpenHostService` and answers with a
representation.

```ts [src/catalog/driving/nestjs/catalog-http-api.ts]
import type { OpenHostService } from "@alveolus/core";
import { Controller, Get, NotFoundException, Param } from "@nestjs/common";

import type { ProductRepresentation } from "../../published-language/product.representation";
import { CatalogApi } from "./catalog-api";

@Controller("products")
export class CatalogHttpApi implements OpenHostService {
	constructor(private readonly catalog: CatalogApi) {}

	@Get(":id")
	async product(@Param("id") productId: string): Promise<ProductRepresentation> {
		const product = await this.catalog.productById(productId);
		if (product === undefined) {
			throw new NotFoundException({ error: "ProductNotFound", productId });
		}
		return product;
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

## Troubleshooting

**`Nest can't resolve dependencies of the CatalogPriceList (?)`**: the downstream module cannot see
the open host service. Export it from the module of its context, and import that module in the
module of the downstream context.

## See also

- [Published Language](./published-language.md), what it answers in
- [Anti-corruption layers](./anti-corruption-layers.md), how another context reads it
- [Project layout: bounded contexts](../../guide/project-layout.md#bounded-contexts)
- [`bc-isolation`](../../rules/bc-isolation.md)
