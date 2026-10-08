---
description: "Architecture rule: an open host service speaks the published language, and never exposes a class of its bounded context."
---

# no-leaky-host-service

An open host service speaks the published language: no class of its context appears in what it
offers.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>strategic/no-leaky-host-service</code></dd>
	<dt>Category</dt><dd><a href="/rules/#strategic">Strategic</a>: what crosses a bounded context</dd>
	<dt>Reports</dt><dd>A class of the project in the parameters, results, properties or getters of an open host service</dd>
	<dt>Applies to</dt><dd>Every class that implements <code>OpenHostService</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"strategic/no-leaky-host-service": "off"</code></a></dd>
</dl>

## Why

`CatalogApi.product` returns the `Product` aggregate, because it was already loaded. Ordering only
imports the open host service, as the rules ask, yet it now holds the catalog's model: a change to
`Product` breaks ordering, and ordering can call `product.changePrice()` from outside its
boundary.

::: tip The fix
The service answers in the published language, plain JSON types that the catalog commits to keep
stable. The model behind it can change freely.
:::

## What it checks

Every public method, property and getter of a class that implements `OpenHostService`: its
parameters and its result, followed into generics, `Promise`, arrays and object types.

| Type | Allowed |
| --- | --- |
| A published-language type, a plain value | ✅ |
| A class of the shared kernel, such as `Money` | ✅ |
| A class of an installed package | ✅ |
| Any other class of the project: an aggregate, an entity, a value object, an identifier, a domain event | ❌ |

The constructor and private members are left out: they wire the service, other contexts never see
them.

## What it reports

```
src/catalog/driving/in-process/catalog-api.ts:6
  strategic/no-leaky-host-service: CatalogApi.product exposes
  Product, an AggregateRoot of catalog: an open host service speaks
  the published language.
```

## Fix it

### Answer in the published language

So that the model can change without breaking other contexts, map it to a representation before it
leaves the service, and take plain values as parameters.

<div class="al-compare">

```ts [❌ Avoid: src/catalog/driving/in-process/catalog-api.ts]
export class CatalogApi implements OpenHostService {
	async product(id: ProductId): Promise<Product | undefined> {
		return this.products.findById(id);
	}
}
```

```ts [✅ Prefer: src/catalog/driving/in-process/catalog-api.ts]
export class CatalogApi implements OpenHostService {
	async productById(productId: string): Promise<ProductRepresentation | undefined> {
		const result = await this.getProduct.handle({ productId });
		return result.ok ? result.value : undefined;
	}
}
```

</div>

## Turn it off

```ts [alveolus.config.ts]
rules: { "strategic/no-leaky-host-service": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new methods answer in the published language while you map the old ones.

## See also

- [Open host services](../../core/strategic/open-host-services.md), what is checked
- [Published Language](../../core/strategic/published-language.md), what the service answers in
- [`strategic/no-cross-context-import`](./no-cross-context-import.md), which makes the service the
  only door of a context
- [Rules](../index.md), every rule by category
