---
description: "Architecture rule: a business failure is returned in a Result, the domain and the application never throw, and exceptions stay in adapters."
---

# no-thrown-failure

A business failure is a value: the aggregate returns it in a `Result`. The domain and the
application never throw; exceptions stay in adapters, for technical failures.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-thrown-failure</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A public method or function property of an aggregate or entity that returns no <code>Result</code>, a public setter, any <code>throw</code> or <code>Promise.reject</code> in the domain or the application</dd>
	<dt>Applies to</dt><dd>Classes that extend <code>AggregateRoot</code> or <code>Entity</code>; every file in <code>domain/</code> and <code>application/</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-thrown-failure": "off"</code></a></dd>
</dl>

## Why

`order.place()` throws `InvalidTotal` when the total is zero. Nothing in its signature says so: the
controller that calls it does not catch it, and a customer gets an error 500 for a mistake they
could have fixed.

::: tip The fix
The method returns `Result<void, InvalidTotal>`. The failure is in the type, and TypeScript makes
every caller deal with it before it reaches the value. A method that changes state says whether it
worked; reads are getters.
:::

## What it checks

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Public methods return a Result</span>Every public method of a class that extends <code>AggregateRoot</code> or <code>Entity</code>, and every public property holding a function, such as <code>place = () =&gt; …</code>, even when its return type is inferred. A <code>Promise</code> of a <code>Result</code> counts. Getters, static methods, <code>toSnapshot</code>, <code>equals</code> and the protocol methods <code>toString</code>, <code>toJSON</code>, <code>valueOf</code> and <code>[Symbol.…]</code> are left out.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>No setter</span>A public setter changes the state without saying whether it worked: a business method does it instead.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Nothing is thrown</span>No <code>throw</code> and no <code>Promise.reject</code> in <code>domain/</code> or <code>application/</code>, whatever is thrown: an <code>Error</code>, a domain error or an <code>unknown</code>. Adapters may throw on a technical failure, such as a lost connection.</div>
</div>

## What it reports

```
src/ordering/domain/aggregates/order.aggregate.ts
  2  error  tactical/no-thrown-failure: Order.place must return a Result:
  expose reads as getters and return business failures as
  values.
  4  error  tactical/no-thrown-failure: A failure is thrown: return it in a
  Result instead.
  9  error  tactical/no-thrown-failure: Order.status is a setter: change the
  state through a business method that returns a Result.
```

## Fix it

### Return the failure in a Result

So that the caller sees what can go wrong, return the domain error with `err(…)` and success with
`ok()`, and declare both in the return type.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.aggregate.ts]
export class Order extends AggregateRoot<OrderId> {
	place(total: number): void {
		if (total <= 0) {
			throw new InvalidTotal({ total });
		}
	}
}
```

```ts [✅ Prefer: src/ordering/domain/aggregates/order.aggregate.ts]
export class Order extends AggregateRoot<OrderId> {
	place(total: number): Result<void, InvalidTotal> {
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		return ok();
	}
}
```

</div>

### Expose reads as getters

So that the public methods are the ones that change state, a read without parameters is a getter,
which the rule leaves out.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.aggregate.ts]
isPlaced(): boolean {
	return this.status === "placed";
}
```

```ts [✅ Prefer: src/ordering/domain/aggregates/order.aggregate.ts]
get isPlaced(): boolean {
	return this.status === "placed";
}
```

</div>

A read that needs parameters, such as `canShip(date)`, returns `ok(…)`, or moves to a
[`DomainService`](../../core/domain/domain-services.md) when it involves more than the aggregate.

### Make the impossible state unrepresentable

So that a guard against an impossible state needs no `throw`, keep the constructor private and
build through a static factory that returns a `Result`: an invalid value never exists.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/value-objects/quantity.value-object.ts]
export class Quantity extends ValueObject<{ value: number }> {
	constructor(value: number) {
		if (value <= 0) {
			throw new Error("A quantity is positive.");
		}
		super({ value });
	}
}
```

```ts [✅ Prefer: src/ordering/domain/value-objects/quantity.value-object.ts]
export class Quantity extends ValueObject<{ value: number }> {
	private constructor(value: number) {
		super({ value });
	}

	static of(value: number): Result<Quantity, InvalidQuantity> {
		return value > 0 ? ok(new Quantity(value)) : err(new InvalidQuantity({ value }));
	}
}
```

</div>

## Limits

::: warning What the rule cannot see
- A promise rejected from its executor, `new Promise((_, reject) => reject(…))`, is not seen: only
  `throw` and `Promise.reject` are.
- A function of a package that throws is not seen either: the rule reads your code, not what it
  calls. Wrap such a call in a `Result` where it happens.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-thrown-failure": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new methods return a `Result` while you convert the old ones.

## See also

- [Result](../../core/utilities/result.md) and [Domain errors](../../core/domain/domain-errors.md), what the methods return
- [Aggregates](../../core/domain/aggregates.md), whose business methods this rule checks
- [`tactical/no-loose-code`](./no-loose-code.md), which keeps `extends Error` out of the domain
- [Rules](../index.md), every rule by category
