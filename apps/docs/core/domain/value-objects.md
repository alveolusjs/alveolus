# Value objects

A value object is described entirely by its values: two amounts of 12 EUR are the same amount. It
is immutable, validates itself when it is created, and its operations return new instances.
Identifiers are value objects too.

```ts
export class Money extends ValueObject<{ amount: number; currency: string }> {
	static of(amount: number, currency: string): Result<Money, InvalidAmount> { … }

	add(other: Money): Money { … }
}
```

## When to use

Use a value object for any concept defined by its values rather than an identity: an amount, an
email address, a date range, a quantity. Wrapping a primitive gives it a name, a place for its rules
and a type the compiler checks: a function that takes `Money` cannot receive a quantity.

## Usage

### Declare a value object

Extend `ValueObject` with the type of its attributes. Keep the constructor private and expose
static factories that validate the input and return a [`Result`](../utilities/result.md).

```ts [src/ordering/domain/value-objects/money.value-object.ts]
import { err, ok, type Result, ValueObject } from "@alveolus/core";

import { InvalidAmount } from "../errors/invalid-amount.error";

export class Money extends ValueObject<{ amount: number; currency: string }> {
	private constructor(amount: number, currency: string) {
		super({ amount, currency });
	}

	static of(amount: number, currency: string): Result<Money, InvalidAmount> {
		if (!Number.isFinite(amount) || amount < 0) {
			return err(new InvalidAmount({ amount }));
		}
		return ok(new Money(amount, currency));
	}

	get amount(): number {
		return this.props.amount;
	}

	get currency(): string {
		return this.props.currency;
	}
}
```

The constructor copies and freezes the attributes: `props` cannot be changed afterwards.

### Return new instances

An operation returns a new value object instead of changing the current one.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/value-objects/money.value-object.ts]
add(other: Money): void {
	this.amount += other.amount;
}
```

```ts [✅ Prefer: src/ordering/domain/value-objects/money.value-object.ts]
add(other: Money): Money {
	return new Money(this.props.amount + other.props.amount, this.props.currency);
}
```

</div>

A value object is shared freely between aggregates and passed around without copies: that is only
safe because it never changes.

### Put the logic on the value object

A calculation on an amount belongs to `Money`, not to a helper next to it. In the domain, every
function is a method of a building block
([`building-blocks-only`](../../rules/building-blocks-only.md)).

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/value-objects/money.ts]
export function roundAmount(amount: number): number {
	return Math.round(amount * 100) / 100;
}
```

```ts [✅ Prefer: src/ordering/domain/value-objects/money.value-object.ts]
rounded(): Money {
	return new Money(Math.round(this.props.amount * 100) / 100, this.props.currency);
}
```

</div>

### Compare value objects

Two value objects are equal when they are of the same class and their attributes are deeply equal.
Nested value objects are compared with their own `equals`; arrays, dates and plain objects by
content.

```ts
twelveEuros.equals(otherTwelveEuros);
```

### Identifiers

An identifier is a value object that names an entity or an aggregate: one class per kind of
entity. The second type parameter is a tag that keeps identifiers apart at compile time; it does
not exist at runtime.

```ts [src/ordering/domain/value-objects/order-id.identifier.ts]
import { Identifier } from "@alveolus/core";

export class OrderId extends Identifier<string, "OrderId"> {}
```

```ts
const id = new OrderId("order_1");

id.equals(new OrderId("order_1"));
JSON.stringify({ id });

function load(id: OrderId) {}
load(new ProductId("product_1"));
```

The second line is `true`, the third gives `{"id":"order_1"}`, and the last one does not compile.
An identifier wraps a `string`, a `number` or a `bigint`. New ids come from the `IdGenerator`
[port](./ports.md), never from the domain itself.

## Reference

### ValueObject

```ts
abstract class ValueObject<Props extends object>
```

| Type parameter | Description |
| --- | --- |
| `Props` | The attributes of the value object. |

| Member | Type | Description |
| --- | --- | --- |
| `constructor(props)` | protected | Copies and freezes the attributes. |
| `props` | protected, `Readonly<Props>` | The attributes. |
| `equals(other)` | `boolean` | Same concrete class and deeply equal attributes. |

`AnyValueObject` is the type of any value object.

**Caveats**

- `props` is frozen one level deep: arrays and objects you pass in can still be changed from
  outside. Do not keep references to them.
- `equals` requires the same concrete class.

### Identifier

```ts
abstract class Identifier<T extends IdentifierValue, Tag extends string = string>

type IdentifierValue = string | number | bigint;
```

| Type parameter | Description |
| --- | --- |
| `T` | The raw value: `string`, `number` or `bigint`. |
| `Tag` | A unique name for the identifier type, used only at compile time. |

| Member | Type | Description |
| --- | --- | --- |
| `constructor(value)` | public | Wraps the raw value. |
| `value` | `T` | The raw value. |
| `equals(other)` | `boolean` | Same concrete class and same value. |
| `toString()` | `string` | The value as a string. |
| `toJSON()` | `T` | The raw value, used by `JSON.stringify`. |

`AnyIdentifier` is the type of any identifier.

**Caveats**

- The constructor is public and does not validate: when an identifier has a format, check it where
  it enters, such as in a driving adapter.
- Without a `Tag`, two identifier classes with the same raw type are interchangeable for the
  compiler.

Import from `@alveolus/core` or `@alveolus/core/value-objects`.

## See also

- [Entities](./entities.md) and [Aggregates](./aggregates.md), identified by identifiers
- [Domain errors](./domain-errors.md), returned by factories
- [Result](../utilities/result.md), to combine several factories
- Rules: [`building-blocks-only`](../../rules/building-blocks-only.md), [`placement`](../../rules/placement.md)
