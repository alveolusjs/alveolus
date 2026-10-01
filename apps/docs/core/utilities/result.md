# Result

A `Result` is the return value of an operation that can fail: either a success carrying a value,
or a failure carrying an error. Failures appear in the signature, and TypeScript makes callers
handle them.

```ts
place(total: number, now: Date): Result<void, OrderAlreadyPlaced | InvalidTotal>
```

## When to use

Return a `Result` from every operation that can fail for an expected reason, usually with a
[domain error](../domain/domain-errors.md). It is a plain object with free functions: no class, no
methods.

## Usage

### Return a result

```ts
if (total <= 0) {
	return err(new InvalidTotal({ total }));
}
return ok();
```

`ok()` without argument is the success of a command; `ok(value)` carries a value, such as the value
object built by a factory.

### Handle a result

Check `ok`; TypeScript narrows the type.

```ts
const result = order.place(42, now);

if (!result.ok) {
	return result.error; // OrderAlreadyPlaced | InvalidTotal
}
```

### Combine results

```ts
const total = map(Money.create(amount, euro), (money) => money.times(quantity));
const order = andThen(parseTotal(input), (value) => placeOrder(value));
```

| Function              | Does                                                          |
| --------------------- | ------------------------------------------------------------- |
| `map(result, fn)`     | Transforms the value of a success.                            |
| `mapErr(result, fn)`  | Transforms the error of a failure.                            |
| `andThen(result, fn)` | Runs `fn`, which returns a `Result`, on the value of a success. |

A failure goes through `map` and `andThen` unchanged.

### Collect several results

`combine` turns several results into one. Pass a tuple or a record; a success carries the values in
the same shape, a failure carries the first error.

```ts
const line = combine({
	price: Money.create(input.price, euro),
	quantity: Quantity.create(input.quantity),
});
// Result<{ price: Money; quantity: Quantity }, InvalidAmount | InvalidQuantity>

const pair = combine([Money.create(input.price, euro), Quantity.create(input.quantity)]);
// Result<[Money, Quantity], InvalidAmount | InvalidQuantity>
```

## Reference

```ts
type Result<T, E> = Ok<T> | Err<E>;
interface Ok<T> { readonly ok: true; readonly value: T }
interface Err<E> { readonly ok: false; readonly error: E }
```

| Function              | Returns                  | Description                                               |
| --------------------- | ------------------------ | --------------------------------------------------------- |
| `ok()`                | `Ok<void>`               | A success without value.                                  |
| `ok(value)`           | `Ok<T>`                  | A success carrying `value`.                               |
| `err(error)`          | `Err<E>`                 | A failure carrying `error`.                               |
| `map(result, fn)`     | `Result<U, E>`           | Transforms the value of a success.                        |
| `mapErr(result, fn)`  | `Result<T, F>`           | Transforms the error of a failure.                        |
| `andThen(result, fn)` | `Result<U, E \| F>`      | Chains an operation that can fail.                        |
| `combine(results)`    | `Result<Values, Errors>` | Collects a tuple or record of results, same shape.        |

**Caveats**

- `combine` stops at the first failure in order: it does not collect every error.

Import from `@alveolus/core` or `@alveolus/core/result`.

## See also

- [Domain Errors](../domain/domain-errors.md), the failures a `Result` carries
- [Value Objects](../domain/value-objects.md#declare-a-value-object), whose factories return a `Result`
- [Aggregate rules](/arch/rules/aggregates#return-failures-do-not-throw-them), which require it
