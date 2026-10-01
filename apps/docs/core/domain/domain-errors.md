# Domain Errors

A domain error is an expected business failure: an invalid total, an order already placed. It is a
value, returned in a [`Result`](../utilities/result.md), never thrown.

```ts
export class InvalidTotal extends DomainError<{ total: number }> {}
```

## When to use

Declare a domain error for each way a business rule can refuse an operation: invalid input, wrong
state, missing permission. Throw an exception only for bugs and broken invariants, which no caller
should handle.

## Usage

### Declare business errors

One class per failure, with an optional typed payload. The error `type` is the class name.

```ts [src/ordering/domain/errors/order.error.ts]
import { DomainError } from "@alveolus/core";

export class OrderAlreadyPlaced extends DomainError {}

export class InvalidTotal extends DomainError<{ total: number }> {}
```

### Return an error

Return the error in an `err` and list it in the return type.

```ts
place(total: number, now: Date): Result<void, InvalidTotal> {
	if (total <= 0) {
		return err(new InvalidTotal({ total }));
	}
	return ok();
}
```

### Read an error

```ts
const result = order.place(0, now);

if (!result.ok) {
	result.error.type; // "InvalidTotal"
	result.error.payload.total; // 0
}
```

### Map errors to a response

Driving adapters import the errors from the domain and narrow them with `instanceof`, which keeps
working when class names are minified.

```ts [src/ordering/driving/http/order-controller.ts]
const result = await this.placeOrder.handle({ orderId, total });

if (!result.ok) {
	if (result.error instanceof OrderNotFound) {
		return reply.status(404).send();
	}
	return reply.status(422).send({ type: result.error.type, ...result.error.payload });
}
return reply.status(204).send();
```

## Reference

```ts
abstract class DomainError<Payload = undefined>
```

| Type parameter | Description                                        |
| -------------- | -------------------------------------------------- |
| `Payload`      | The data describing the failure. None by default.  |

| Member                   | Type      | Description                                                 |
| ------------------------ | --------- | ----------------------------------------------------------- |
| `constructor(payload?)`  | public    | Requires a payload only when `Payload` is declared.         |
| `type`                   | `string`  | The class name.                                             |
| `payload`                | `Payload` | The data describing the failure.                            |

**Caveats**

- A `DomainError` is not an `Error`: it has no stack trace and is never thrown.
- `type` comes from the class name: keep class names when bundling.

Import from `@alveolus/core` or `@alveolus/core/domain-errors`.

## See also

- [Result](../utilities/result.md), which carries domain errors
- [Aggregates](./aggregates.md#return-business-errors), which return them
- [Scenarios](/testing/scenarios), to assert on them
- [Project layout](/arch/project-layout), where they live
