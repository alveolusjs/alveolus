# Result

A `Result` is the outcome of an operation that can fail for a business reason: either `ok` with a
value, or `err` with a [domain error](../domain/domain-errors.md). Failures are returned, never
thrown, so every signature lists what can go wrong and TypeScript makes the caller handle it.

```ts
function place(total: number): Result<void, InvalidTotal> {
	return total > 0 ? ok() : err(new InvalidTotal({ total }));
}
```

## When to use

Return a `Result` from every operation that can fail in a way the business expects: an invalid
amount, an order already placed, a product not found. Business methods of
[aggregates](../domain/aggregates.md), factories of [value objects](../domain/value-objects.md),
[domain services](../domain/domain-services.md) and [command handlers](../application/command-handlers.md)
all return one.

Keep exceptions for what nobody expects: a bug, a broken invariant, a lost database connection.

## Usage

### Return a success or a failure

`ok(value)` and `err(error)` build the two cases. `ok()` without argument is the success of an
operation that returns nothing.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
place(total: number, eventId: string, now: Date): Result<void, InvalidTotal | OrderAlreadyPlaced> {
	if (this.isPlaced) {
		return err(new OrderAlreadyPlaced());
	}
	if (total <= 0) {
		return err(new InvalidTotal({ total }));
	}
	this.placedTotal = total;
	this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt: now, payload: { total } }));
	return ok();
}
```

### Read a result

A `Result` is a plain object with an `ok` flag. Checking it narrows the type: after `if
(!result.ok)`, TypeScript knows `result.error`; after it, `result.value`.

```ts [src/ordering/application/commands/place-order.command.ts]
const placed = order.place(total, this.ids.next(), this.clock.now());
if (!placed.ok) {
	return placed;
}
await this.orders.save(order);
return ok();
```

Returning the failure as is keeps its type: the handler's error union includes the aggregate's.

### Return errors instead of throwing them

<div class="al-compare">

```ts [❌ Avoid]
place(total: number): void {
	if (total <= 0) {
		throw new InvalidTotal({ total });
	}
}
```

```ts [✅ Prefer]
place(total: number): Result<void, InvalidTotal> {
	if (total <= 0) {
		return err(new InvalidTotal({ total }));
	}
	return ok();
}
```

</div>

::: details Why?
Nothing in `place(total: number): void` tells the caller it may fail, so it forgets. With a
`Result`, the failure is part of the type and cannot be ignored silently.
`alveolus arch check` reports a thrown domain error and a public aggregate method that returns no
`Result` ([`errors-as-values`](../../rules/errors-as-values.md)).
:::

### Transform the value or the error

`map` changes the value of a success, `mapErr` the error of a failure; the other case passes
through untouched.

```ts
const total = map(Money.create(amount, currency), (money) => money.amount);
const http = mapErr(placed, (error) => ({ status: 422, code: error.type }));
```

### Chain operations that can fail

`andThen` runs the next step only when the previous one succeeded, and collects both error types.

```ts [src/ordering/domain/value-objects/money.value-object.ts]
static parse(amount: number, code: string): Result<Money, UnknownCurrency | NegativeAmount> {
	return andThen(Currency.create(code), (currency) => Money.create(amount, currency));
}
```

### Combine several results

`combine` takes an array or an object of results. It returns all the values in the same shape, or
the first failure.

```ts
const address = combine({ city: City.create(input.city), street: Street.create(input.street), zip: ZipCode.create(input.zip) });
if (!address.ok) {
	return address;
}
address.value.city;

const pair = combine([Money.create(10, eur), Money.create(20, eur)]);
```

### Map a result to a response

At the edge, a driving adapter turns the failure into whatever its transport expects.

```ts [src/ordering/driving/http/controllers/orders.controller.ts]
const placed = await this.placeOrder.handle({ orderId, total: body.total });
if (!placed.ok) {
	return { status: 422, body: { error: placed.error.type, details: placed.error.payload } };
}
return { status: 204 };
```

## Reference

```ts
type Result<T, E> = Ok<T> | Err<E>;

interface Ok<T> { readonly ok: true; readonly value: T }
interface Err<E> { readonly ok: false; readonly error: E }

function ok(): Ok<void>;
function ok<T>(value: T): Ok<T>;
function err<E>(error: E): Err<E>;
function map<T, E, U>(result: Result<T, E>, transform: (value: T) => U): Result<U, E>;
function mapErr<T, E, F>(result: Result<T, E>, transform: (error: E) => F): Result<T, F>;
function andThen<T, E, U, F>(result: Result<T, E>, next: (value: T) => Result<U, F>): Result<U, E | F>;
function combine(results: readonly Result[] | Record<string, Result>): Result<values in the same shape, first error>;
```

| Function | Description |
| --- | --- |
| `ok()` / `ok(value)` | A success, with no value or with one. |
| `err(error)` | A failure. |
| `map(result, transform)` | Transforms the value of a success. |
| `mapErr(result, transform)` | Transforms the error of a failure. |
| `andThen(result, next)` | Runs `next` on the value of a success; its errors add to the union. |
| `combine(results)` | All the values, as an array or an object, or the first failure. |

**Caveats**

- `Result` is a discriminated union, not a class: there are no methods, and narrowing on `ok`
  works as for any union.
- `combine` stops at the first failure in order; it does not collect every error.
- A `Result` carries expected failures. Technical failures, such as a lost connection, are thrown
  and handled like any other exception.

Import from `@alveolus/core` or `@alveolus/core/result`.

## See also

- [Domain Errors](../domain/domain-errors.md), what a failure carries
- [Aggregates](../domain/aggregates.md) and [Command handlers](../application/command-handlers.md), which return results
- [`errors-as-values`](../../rules/errors-as-values.md)
