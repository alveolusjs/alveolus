---
description: "Architecture rule: an open host service speaks the published language: it never exposes a class of its bounded context, never receives a function and never returns an erased type."
---

# no-leaky-host-service

An open host service speaks the published language: data in, data out. No class of its context
appears in what it offers, it receives no function, and what it returns has a type.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>strategic/no-leaky-host-service</code></dd>
	<dt>Category</dt><dd><a href="/rules/#strategic">Strategic</a>: what crosses a bounded context</dd>
	<dt>Reports</dt><dd>A class of the project in the parameters, results, properties or getters of an open host service; a function among its parameters; <code>unknown</code>, <code>any</code> or <code>object</code> as a result</dd>
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

Its parameters carry data, never behaviour: a function is reported wherever it sits, as a
parameter, a property of an object parameter (`{ onSettled: () => void }`), an item of an array or
a method of an interface it receives. A class, such as `Date` or `AbortSignal`, is not a function.

Its results have a type: `unknown`, `any` and `object`, alone or in a `Promise`, are reported. A
parameter may be `unknown`, for a payload the service validates.

The constructor and private members are left out: they wire the service, other contexts never see
them.

## What it reports

```
src/catalog/driving/in-process/catalog-api.ts
  6  error  strategic/no-leaky-host-service: CatalogApi.product exposes
  Product, an AggregateRoot of catalog: an open host service speaks
  the published language.
  9  error  strategic/no-leaky-host-service: CatalogApi.onRestockNeeded
  receives a function: an open host service receives data, never
  behaviour, or the upstream context ends up running code of another
  one. To let another context react, publish an integration event.
 12  error  strategic/no-leaky-host-service: CatalogApi.inspect returns
  unknown: an open host service returns a type of its published
  language, so that what leaves the context can be seen.
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

### Publish an event instead of taking a callback

So that the upstream context never runs code of another one, it does not accept a callback to call
when something happens: it publishes an integration event, and the downstream context subscribes
to it. The context map then says the truth: the downstream context consumes the upstream one, not
the other way round.

<div class="al-compare">

```ts [❌ Avoid: src/catalog/driving/in-process/catalog-api.ts]
export class CatalogApi implements OpenHostService {
	onRestockNeeded(callback: RestockCallback): void {
		this.handlers.connect(callback);
	}
}
```

```ts [✅ Prefer: src/catalog/application/translators/catalog-events.translator.ts]
export class CatalogEventsTranslator extends EventTranslator<
	RestockNeeded,
	RestockNeededRepresentation
> {
	protected readonly source = "catalog";

	translate(event: RestockNeeded, context: IntegrationEventContext) {
		return this.wrap(event, context, {
			payload: { productId: event.productId.value, quantity: event.quantity },
			type: "catalog.restock-needed",
			version: 1,
		});
	}
}
```

</div>

## Limits

::: warning What the rule cannot see
- A plain object typed by hand with the fields of the aggregate: the rule follows classes and
  erased types, not shapes. In review, a method of an open host service returns a type of
  `published-language/`.
- A function smuggled through a parameter typed `unknown`: parameters may be `unknown`, for a
  payload to validate, so the rule cannot tell. In review, an `unknown` parameter is parsed, never
  called.
- A DTO class of the context is a leak too, on purpose: the published language is made of types,
  not classes.
:::

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
