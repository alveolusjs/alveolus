# errors-as-values

An expected business failure is a value: the aggregate returns it in a `Result`, and every caller
sees, in the signature, what can go wrong. Exceptions stay for bugs.

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

## What it checks

- Every public method of a class that extends `AggregateRoot` or `Entity` returns a `Result`, even
  when its return type is inferred. Getters, static methods, `toSnapshot` and `equals` are left
  out.
- No `DomainError` is thrown, anywhere in the project.

## Why

A thrown error is invisible in a signature: the caller does not know it has to handle it, and
forgets. A `Result` lists every failure in the type, and TypeScript makes the caller deal with it.
Requiring it on every public method of an aggregate also keeps the API honest: a method that
changes state says whether it worked, and reads are getters.

A read that needs parameters, such as `canShip(date)`, returns `ok(…)`, or moves to a
`DomainService` when it involves more than the aggregate.

## What it reports

```
src/ordering/domain/aggregates/order.aggregate.ts:2
  errors-as-values: Order.place must return a Result: expose reads as getters and return business failures as values.

src/ordering/domain/aggregates/order.aggregate.ts:4
  errors-as-values: A DomainError is thrown: return it in a Result instead.
```

## Turn it off

```ts
rules: { "errors-as-values": "off" }
```

## See also

- [`building-blocks-only`](./building-blocks-only.md), which keeps `extends Error` out of the domain
