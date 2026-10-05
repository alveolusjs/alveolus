# Domain errors

A domain error is an expected business failure: a total that is not positive, an order already
placed. It is a value, returned in a [`Result`](../utilities/result.md), never thrown, so every
caller sees in the signature what can go wrong.

```ts
export class InvalidTotal extends DomainError<{ total: number }> {}

return err(new InvalidTotal({ total }));
```

## When to use

Declare a domain error for every way a business operation can be refused by the rules. Keep
exceptions for what should never happen: a bug, a broken invariant, a lost database connection.
Those are thrown as plain `Error`s.

## Usage

### Declare an error

One class per failure, one file per class, extending `DomainError` with the type of its payload.
The class has no body.

```ts [src/ordering/domain/errors/invalid-total.error.ts]
import { DomainError } from "@alveolus/core";

export class InvalidTotal extends DomainError<{ total: number }> {}
```

An error without data takes no type parameter, and no argument:

```ts [src/ordering/domain/errors/order-already-placed.error.ts]
import { DomainError } from "@alveolus/core";

export class OrderAlreadyPlaced extends DomainError {}
```

```ts
new InvalidTotal({ total: 0 });
new OrderAlreadyPlaced();
```

### Return it, never throw it

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.aggregate.ts]
place(total: number): void {
	if (total <= 0) {
		throw new InvalidTotal({ total });
	}
}
```

```ts [✅ Prefer: src/ordering/domain/aggregates/order.aggregate.ts]
place(total: number, eventId: string, now: Date): Result<void, InvalidTotal> {
	if (total <= 0) {
		return err(new InvalidTotal({ total }));
	}
	…
	return ok();
}
```

</div>

A `DomainError` is not an `Error`: it has no stack trace and is not meant to be thrown. Throwing one
is reported by [`errors-as-values`](../../rules/errors-as-values.md).

### List the errors of a use case

A method returns the union of the errors it can produce. A
[command handler](../application/command-handlers.md) declares the union of everything it may
return, and passes failures through unchanged.

```ts
export type PlaceOrderError = OrderNotFound | InvalidTotal | OrderAlreadyPlaced;

export class PlaceOrderHandler extends CommandHandler<PlaceOrder, void, PlaceOrderError> { … }
```

### Handle it at the edge

The driving adapter turns the error into a response. `instanceof` narrows the union; `type` gives
the class name, and `payload` the data.

```ts [src/ordering/driving/http/controllers/orders.controller.ts]
if (!placed.ok) {
	const body = { error: placed.error.type, details: placed.error.payload };
	if (placed.error instanceof OrderNotFound) {
		return { status: 404, body };
	}
	return { status: 422, body };
}
```

### Compare errors in tests

Errors are plain objects: compare them with `toEqual`.

```ts
expect(order.place(0, "event_1", now)).toEqual(err(new InvalidTotal({ total: 0 })));
```

## Reference

```ts
abstract class DomainError<Payload = undefined>
```

| Type parameter | Description |
| --- | --- |
| `Payload` | The data describing the failure. Defaults to `undefined`: no data. |

| Member | Type | Description |
| --- | --- | --- |
| `constructor(payload)` | public | Takes the payload, or no argument when `Payload` is `undefined`. |
| `payload` | `Payload` | The data of the failure. |
| `type` | `string` | The class name, such as `"InvalidTotal"`. |

`AnyDomainError` is the type of any domain error; handlers only accept errors of this type.

**Caveats**

- `type` is the class name: a bundler that minifies class names changes it. Keep class names in
  your build (`keep_classnames` in Terser, `keepNames` in esbuild), or narrow with `instanceof`.
- A `DomainError` does not extend `Error`. In the domain and the application, `class X extends
  Error` is reported by [`building-blocks-only`](../../rules/building-blocks-only.md): a bug is
  thrown as `new Error("…")`.

Import from `@alveolus/core` or `@alveolus/core/domain-errors`.

## Troubleshooting

**`Expected 0 arguments, but got 1`** or **`Expected 1 arguments, but got 0`**: the arguments do
not match the payload type. An error declared without a type parameter takes no argument; one
declared with a payload requires it.

## See also

- [Result](../utilities/result.md), how errors are returned and combined
- [Aggregates](./aggregates.md) and [Value objects](./value-objects.md), which return them
- [Command handlers](../application/command-handlers.md), which declare them
- Rules: [`errors-as-values`](../../rules/errors-as-values.md), [`building-blocks-only`](../../rules/building-blocks-only.md)
