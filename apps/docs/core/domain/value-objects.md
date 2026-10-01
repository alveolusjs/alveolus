# Value Objects

A value object is an immutable object defined only by its attributes, such as an amount, an email
address or a date range. Two value objects with the same attributes are interchangeable.

```ts
const price = Money.create(12, euro);

if (price.ok) {
	price.value.times(3); // a new Money; price.value is unchanged
}
```

## When to use

Use a value object for any concept described by its values rather than an identity: amounts,
quantities, addresses, periods. Prefer it to a primitive (`number`, `string`) as soon as the value
has rules, such as a currency that must be a three-letter code.

## Usage

### Declare a value object

Extend `ValueObject` with the type of its attributes. Keep the constructor private and validate the
input in a static factory that returns a [`Result`](../utilities/result.md).

```ts [src/shared-kernel/domain/value-objects/money.value-object.ts]
import { err, ok, type Result, ValueObject } from "@alveolus/core";
import { InvalidAmount } from "../errors/money.error.ts";
import type { Currency } from "./currency.value-object.ts";

export class Money extends ValueObject<{ amount: number; currency: Currency }> {
	private constructor(props: { amount: number; currency: Currency }) {
		super(props);
	}

	static create(amount: number, currency: Currency): Result<Money, InvalidAmount> {
		if (amount < 0) {
			return err(new InvalidAmount({ amount }));
		}
		return ok(new Money({ amount, currency }));
	}

	get amount(): number {
		return this.props.amount;
	}

	get currency(): Currency {
		return this.props.currency;
	}

	times(quantity: number): Money {
		return new Money({ amount: this.props.amount * quantity, currency: this.props.currency });
	}
}
```

A value object can hold other value objects, such as `Currency` above.

### Read the attributes

`props` is protected: expose what callers need through getters.

```ts
get amount(): number {
	return this.props.amount;
}
```

### Return new instances

An operation returns a new value object instead of changing the current one.

```ts
times(quantity: number): Money {
	return new Money({ amount: this.props.amount * quantity, currency: this.props.currency });
}
```

### Compare value objects

Two value objects are equal when they are of the same class and their attributes are deeply equal.
Nested value objects are compared with their own `equals`; arrays, dates and plain objects are
compared by content.

```ts
twelveEuros.equals(otherTwelveEuros); // true
```

## Reference

```ts
abstract class ValueObject<Props extends object>
```

| Type parameter | Description                         |
| -------------- | ----------------------------------- |
| `Props`        | The attributes of the value object. |

| Member               | Type                       | Description                                          |
| -------------------- | -------------------------- | ---------------------------------------------------- |
| `constructor(props)` | protected                  | Copies and freezes the attributes.                   |
| `props`              | protected, `Readonly<Props>` | The attributes.                                     |
| `equals(other)`      | `boolean`                  | Same class and deeply equal attributes.              |

**Caveats**

- `props` is frozen one level deep: arrays and objects you pass in can still be changed. Do not
  keep references to them.

Import from `@alveolus/core` or `@alveolus/core/value-objects`.

## See also

- [Entities](./entities.md), for things with an identity
- [Result](../utilities/result.md), returned by factories
- [Value object rules](/arch/rules/value-objects), checked by `alveolus arch check`
