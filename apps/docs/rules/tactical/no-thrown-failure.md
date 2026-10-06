# no-thrown-failure

An expected business failure is a value: the aggregate returns it in a `Result`, and exceptions
stay for bugs.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-thrown-failure</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A public method of an aggregate or entity that returns no <code>Result</code>, a thrown <code>DomainError</code></dd>
	<dt>Applies to</dt><dd>Classes that extend <code>AggregateRoot</code> or <code>Entity</code>; <code>throw</code> anywhere in the project</dd>
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

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Public methods return a Result</span>Every public method of a class that extends <code>AggregateRoot</code> or <code>Entity</code>, even when its return type is inferred. Getters, static methods, <code>toSnapshot</code> and <code>equals</code> are left out.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>No DomainError is thrown</span>Anywhere in the project: a domain error is returned, never thrown.</div>
</div>

## What it reports

```
src/ordering/domain/aggregates/order.aggregate.ts:2
  tactical/no-thrown-failure: Order.place must return a Result:
  expose reads as getters and return business failures as
  values.

src/ordering/domain/aggregates/order.aggregate.ts:4
  tactical/no-thrown-failure: A DomainError is thrown: return
  it in a Result instead.
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

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-thrown-failure": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new methods return a `Result` while you convert the old ones.

## See also

- [Result](../../core/utilities/result.md) and [Domain errors](../../core/domain/domain-errors.md), what the methods return
- [Aggregates](../../core/domain/aggregates.md), whose business methods this rule checks
- [`tactical/no-plain-class`](./no-plain-class.md), which keeps `extends Error` out of the domain
- [Rules](../index.md), every rule by category
