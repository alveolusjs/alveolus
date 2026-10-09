---
description: "Architecture rule: an aggregate, an entity, a value object or an identifier keeps its state private and exposes it through getters."
---

# no-public-field

An aggregate, an entity, a value object or an identifier keeps its state private: nothing outside
changes it, and what callers need is read through a getter.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-public-field</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A public instance field, declared or as a constructor parameter, <code>readonly</code> or not</dd>
	<dt>Applies to</dt><dd>Every class that extends <code>AggregateRoot</code>, <code>Entity</code>, <code>ValueObject</code> or <code>Identifier</code>, in core bounded contexts and the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-public-field": "off"</code></a></dd>
</dl>

## Why

`Product` has `public stock = 0`. The reservation handler checks the stock and subtracts the
quantity itself; the next handler does the same with a slightly different check. The rule "a
product is never reserved beyond its stock" now lives in four handlers, and the aggregate is a bag
of fields: the model is anemic, and the day the rule changes, nobody finds every copy.

::: tip The fix
The state is private, and changes through a method that returns a `Result`: `product.reserve(quantity)`.
A value the outside needs to read is a getter. The rule lives once, where the state is.
:::

## What it checks

Every instance field of a class that extends one of the four building blocks:

| Field | Allowed |
| --- | --- |
| `private stock`, `protected readonly addedAt` | ✅ |
| `constructor(private readonly sku: string)` | ✅ |
| `get price(): Money` | ✅ |
| `public static readonly limit = 100` | ✅ |
| `public stock = 0`, `public readonly sku` | ❌ |
| `constructor(public readonly name: string)` | ❌ |

A `readonly` public field is reported too: a value object of it can still be mutated, and the
getter keeps the shape of the class free to change.

## What it reports

```
src/catalog/domain/aggregates/product.aggregate.ts
  4  error  tactical/no-public-field: Product.stock is a public field:
     keep the state private, and expose what callers need through a
     getter.
```

## Fix it

### Change the state through a method

<div class="al-compare">

```ts [❌ Avoid: src/catalog/domain/aggregates/product.aggregate.ts]
export class Product extends AggregateRoot<ProductId> {
	public stock = 0;
}

// in a handler
if (product.stock >= quantity) {
	product.stock -= quantity;
}
```

```ts [✅ Prefer: src/catalog/domain/aggregates/product.aggregate.ts]
export class Product extends AggregateRoot<ProductId> {
	private stock = 0;

	get available(): number {
		return this.stock;
	}

	reserve(quantity: number): Result<void, OutOfStock> {
		if (this.stock < quantity) {
			return err(new OutOfStock({ quantity }));
		}
		this.stock -= quantity;
		return ok();
	}
}
```

</div>

## Limits

::: warning What the rule cannot see
- A getter that returns a mutable object, such as the array of lines: a caller can push into it.
  Return a copy, or a readonly type.
- A `protected` field: a subclass may change it. The rule stops the outside, not the hierarchy.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-public-field": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new fields stay private while you move the rules back into the aggregates.

## See also

- [Aggregates](../../core/domain/aggregates.md) and [Entities](../../core/domain/entities.md), what is checked
- [`tactical/no-thrown-failure`](./no-thrown-failure.md), which makes every change return a `Result`
- [Rules](../index.md), every rule by category
