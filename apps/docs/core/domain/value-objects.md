# Value objects

A value object is an immutable value described only by its attributes, such as an amount or an
identifier.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain</dd>
	<dt>File</dt><dd><code>domain/value-objects/money.value-object.ts</code>, <code>domain/value-objects/order-id.identifier.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>ValueObject&lt;Props&gt;</code></a> or <a href="#identifier"><code>Identifier&lt;T, Tag&gt;</code></a></dd>
	<dt>Used by</dt><dd><a href="/core/domain/aggregates">Aggregates</a>, <a href="/core/domain/entities">entities</a>, <a href="/core/domain/domain-events">domain events</a>, <a href="/core/application/command-handlers">command handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/tactical/no-plain-class"><code>tactical/no-plain-class</code></a></dd>
</dl>

## Why

A price is a `number` and a currency a `string`. Every function that takes them checks that the
amount is not negative, or forgets to. Adding 12 EUR and 5 USD compiles. A function that expects an
`orderId: string` happily receives a customer id.

::: tip The fix
`Money` holds the amount and the currency together, refuses a negative amount once, when it is
created, and only adds amounts of the same currency. `OrderId` and `CustomerId` are two types: the
compiler refuses one where the other is expected.
:::

## How it works

A value object has no identity: two amounts of 12 EUR are the same amount, and one can replace the
other. Three properties follow:

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Valid from the start</span>A static factory checks the input and returns a <a href="/core/utilities/result"><code>Result</code></a>. An invalid value never exists.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Never changes</span>Its attributes are frozen. An operation returns a new value object.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Equal by value</span>Two value objects of the same class with equal attributes are equal.</div>
</div>

```ts
const price = Money.of(12, "EUR");
if (!price.ok) {
	return price;
}
const total = price.value.add(shipping);
```

An [identifier](#identifier) is a value object that names an entity or an aggregate.

## Where it fits

Raw values come in at the edge, as strings and numbers. The
[command handler](../application/command-handlers.md) turns them into value objects, and from there
on the domain only sees typed values.

<div class="al-diagram">
<svg viewBox="0 0 680 120" role="img" aria-label="A controller receives orderId as a string. The command handler wraps it in an OrderId, passes it to the repository, which loads the Order.">
	<defs>
		<marker id="value-object-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="32" width="148" height="56" rx="8" />
	<text class="label" x="82" y="56" text-anchor="middle">Controller</text>
	<text class="note" x="82" y="76" text-anchor="middle">orderId: string</text>
	<path class="link" d="M 156 60 L 178 60" marker-end="url(#value-object-flow-arrow)" />
	<rect class="boundary" x="180" y="32" width="148" height="56" rx="8" />
	<text class="label" x="254" y="56" text-anchor="middle">OrderId</text>
	<text class="note" x="254" y="76" text-anchor="middle">new OrderId(…)</text>
	<path class="link" d="M 328 60 L 350 60" marker-end="url(#value-object-flow-arrow)" />
	<rect class="box" x="352" y="32" width="148" height="56" rx="8" />
	<text class="label" x="426" y="56" text-anchor="middle">Orders</text>
	<text class="note" x="426" y="76" text-anchor="middle">findById(id)</text>
	<path class="link" d="M 500 60 L 522 60" marker-end="url(#value-object-flow-arrow)" />
	<rect class="box" x="524" y="32" width="148" height="56" rx="8" />
	<text class="label" x="598" y="56" text-anchor="middle">Order</text>
	<text class="note" x="598" y="76" text-anchor="middle">holds CustomerId</text>
</svg>
</div>

::: tip
Value objects are saved as their raw values: `Money` becomes `{ amount, currency }` in the snapshot
of its aggregate, and `OrderId` becomes a string.
:::

## API

```ts
import { Identifier, ValueObject } from "@alveolus/core";
// or: from "@alveolus/core/value-objects"
```

### ValueObject

#### Type parameters

```ts
abstract class ValueObject<Props extends object> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Props` | The attributes of the value object. | an object |

`AnyValueObject` is the type of any value object.

#### `constructor(props)` <Badge type="info" text="protected" /> <Badge type="tip" text="you call it" />

```ts
protected constructor(props: Props)
```

Copies and freezes the attributes. Declare your own constructor `private` and call
`super(props)` from it: only your factories use it.

#### `of(…)` <Badge type="info" text="static · convention" /> <Badge type="tip" text="you implement it" />

```ts
static of(
	amount: number,
	currency: Currency,
): Result<Money, InvalidAmount>
```

A factory, or several. Checks the input and returns a `Result`.

#### `props` <Badge type="info" text="protected · readonly" /> <Badge type="tip" text="inside your methods" />

```ts
protected readonly props: Readonly<Props>
```

The attributes, copied and frozen. Expose what callers need through getters.

#### `equals(other)` <Badge type="tip" text="called by anyone" />

```ts
equals(other: ValueObject<object>): boolean
```

`true` for the same object, or the same class with deeply equal attributes. Nested value objects
use their own `equals`; arrays, dates and plain objects are compared by content.

### Identifier

#### Type parameters

```ts
abstract class Identifier<
	T extends IdentifierValue,
	Tag extends string = string,
> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `T` | The raw value. | `string`, `number` or `bigint` |
| `Tag` | A unique name that keeps identifier types apart at compile time. It does not exist at runtime. | a string literal; any string by default |

`AnyIdentifier` is the type of any identifier, and `IdentifierValue` the type of its raw value.

#### `constructor(value)` <Badge type="tip" text="you call it" />

```ts
constructor(value: T)
```

Wraps the raw value. The constructor is public and does not validate. An identifier has no body:
declare the class only.

```ts
class OrderId extends Identifier<string, "OrderId"> {}
```

#### `value` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by anyone" />

```ts
readonly value: T
```

The raw value.

#### `equals(other)` <Badge type="tip" text="called by anyone" />

```ts
equals(other: AnyIdentifier): boolean
```

`true` for the same class with the same value.

#### `toString()` <Badge type="tip" text="called by anyone" />

```ts
toString(): string
```

The value as a string.

#### `toJSON()` <Badge type="tip" text="called by JSON.stringify" />

```ts
toJSON(): T
```

The raw value, so that an identifier serializes as its value.

::: warning Caveats
- `props` is frozen one level deep: arrays and objects you pass in can still be changed from
  outside. Do not keep references to them.
- `equals` requires the same concrete class.
- The constructor of an identifier is public and does not validate: when an identifier has a
  format, check it where it enters, such as in a driving adapter.
- Without a `Tag`, two identifier classes with the same raw type are interchangeable for the
  compiler.
:::

## Usage

Build `Money`, a value object of the running example, then `OrderId`, an identifier. Each step shows the whole file it changes: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-declare-it">Declare it</a></span>Attributes, copied and frozen.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-check-it-in-a-factory">Check it in a factory</a></span>No wrong value exists.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-expose-reads-as-getters">Expose reads as getters</a></span>Read without changing.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-return-a-new-value">Return a new value</a></span>Never change in place.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-name-an-identity">Name an identity</a></span>An identifier for an aggregate.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-use-them">Use them</a></span>Build, compare, combine.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">7</span><a href="#_7-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Declare it

A value object is described by its attributes only: they are its type parameter, read-only, and
`ValueObject` stores them, copied and frozen, in `props`. An attribute can itself be a value
object, such as `Currency`. The constructor parameters are only
passed to `super`, so they stay plain.

```ts [src/ordering/domain/value-objects/money.value-object.ts]
import { ValueObject } from "@alveolus/core";

import { Currency } from "./currency.value-object";

export class Money extends ValueObject<{
	readonly amount: number;
	readonly currency: Currency;
}> {
	private constructor(amount: number, currency: Currency) {
		super({ amount, currency });
	}
}
```

### 2. Check it in a factory

So that no `Money` exists with a wrong amount, the constructor is private and a factory checks the
input once. A refusal is a [domain error](./domain-errors.md) in a `Result`.

```ts [src/ordering/domain/value-objects/money.value-object.ts]
import { ValueObject } from "@alveolus/core"; // [!code --]
import { err, ok, type Result, ValueObject } from "@alveolus/core"; // [!code ++]

import { InvalidAmount } from "../errors/invalid-amount.error"; // [!code ++]
import { Currency } from "./currency.value-object";

export class Money extends ValueObject<{
	readonly amount: number;
	readonly currency: Currency;
}> {
	private constructor(amount: number, currency: Currency) {
		super({ amount, currency });
	}

	static of( // [!code ++]
		amount: number, // [!code ++]
		currency: Currency, // [!code ++]
	): Result<Money, InvalidAmount> { // [!code ++]
		if (!Number.isFinite(amount) || amount < 0) { // [!code ++]
			return err(new InvalidAmount({ amount })); // [!code ++]
		} // [!code ++]
		return ok(new Money(amount, currency)); // [!code ++]
	} // [!code ++]
}
```

### 3. Expose reads as getters

`props` is protected: callers read what they need through getters, and nothing can change it.

```ts [src/ordering/domain/value-objects/money.value-object.ts]
import { err, ok, type Result, ValueObject } from "@alveolus/core";

import { InvalidAmount } from "../errors/invalid-amount.error";
import { Currency } from "./currency.value-object";

export class Money extends ValueObject<{
	readonly amount: number;
	readonly currency: Currency;
}> {
	private constructor(amount: number, currency: Currency) {
		super({ amount, currency });
	}

	static of(
		amount: number,
		currency: Currency,
	): Result<Money, InvalidAmount> {
		if (!Number.isFinite(amount) || amount < 0) {
			return err(new InvalidAmount({ amount }));
		}
		return ok(new Money(amount, currency));
	}

	get amount(): number { // [!code ++]
		return this.props.amount; // [!code ++]
	} // [!code ++]

	get currency(): Currency { // [!code ++]
		return this.props.currency; // [!code ++]
	} // [!code ++]
}
```

### 4. Return a new value

A value object never changes: an operation returns a new one. Two values with the same attributes
are `equals`, whichever instance you hold.

```ts [src/ordering/domain/value-objects/money.value-object.ts]
import { err, ok, type Result, ValueObject } from "@alveolus/core";

import { InvalidAmount } from "../errors/invalid-amount.error";
import { Currency } from "./currency.value-object";

export class Money extends ValueObject<{
	readonly amount: number;
	readonly currency: Currency;
}> {
	private constructor(amount: number, currency: Currency) {
		super({ amount, currency });
	}

	static of(
		amount: number,
		currency: Currency,
	): Result<Money, InvalidAmount> {
		if (!Number.isFinite(amount) || amount < 0) {
			return err(new InvalidAmount({ amount }));
		}
		return ok(new Money(amount, currency));
	}

	get amount(): number {
		return this.props.amount;
	}

	get currency(): Currency {
		return this.props.currency;
	}

	add(other: Money): Money { // [!code ++]
		return new Money( // [!code ++]
			this.props.amount + other.props.amount, // [!code ++]
			this.props.currency, // [!code ++]
		); // [!code ++]
	} // [!code ++]
}
```

### 5. Name an identity

An identifier is a value object that names an entity or an aggregate. It has no body, and its tag
keeps an `OrderId` apart from a `CustomerId` at compile time.

```ts [src/ordering/domain/value-objects/order-id.identifier.ts]
import { Identifier } from "@alveolus/core";

export class OrderId extends Identifier<string, "OrderId"> {}
```

### 6. Use them

Callers build a `Money` through `of` and handle its refusal; an identifier wraps a raw value
directly, and is compared by value.

```ts
const price = Money.of(12.5, currency);
if (!price.ok) {
	return price;
}
const total = price.value.add(shipping);
const unchanged = total.equals(price.value);
const orderId = new OrderId(command.orderId);
```

### 7. Check it

Run the checks. Three rules keep the value objects the way they are now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-plain-class"><code>no-plain-class</code></a></span>Behaviour on a value lives in its class, not in a free function.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span><code>*.value-object.ts</code> and <code>*.identifier.ts</code>, in <code>domain/value-objects/</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-impure-domain"><code>no-impure-domain</code></a></span>It imports the domain only, or a package listed in <code>domainDependencies</code>.</div>
</div>

An operation written as a function is reported:

```
src/ordering/domain/money.ts:3
  tactical/no-plain-class: The function addMoney floats outside
  any class: make it a method of a value object or of a
  DomainService.
```

## See also

- [Entities](./entities.md) and [Aggregates](./aggregates.md), identified by identifiers
- [Domain errors](./domain-errors.md), returned by factories
- [Result](../utilities/result.md), to combine several factories
- Rules: [`tactical/no-plain-class`](../../rules/tactical/no-plain-class.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
- Vaughn Vernon, *Implementing Domain-Driven Design*, chapter 6, "Value Objects"
