# building-blocks-only

The domain and the application contain building blocks, and nothing else. Every class extends one
from `@alveolus/core`, so every piece of logic has a known home and nothing floats around.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/services/pricing.ts]
export class PriceHelper {}

export function roundAmount(amount: number): number {
	return Math.round(amount * 100) / 100;
}

export enum OrderStatus {
	Draft,
	Placed,
}

export class PriceTooHigh extends Error {}
```

```ts [✅ Prefer: src/ordering/domain/value-objects/money.value-object.ts]
import { ValueObject } from "@alveolus/core";

export class Money extends ValueObject<{ amount: number }> {
	rounded(): Money {
		return new Money({ amount: Math.round(this.props.amount * 100) / 100 });
	}
}
```

</div>

## What it checks

In `domain/` and `application/`, of a bounded context or of the shared kernel, every top-level
declaration:

| Declaration | Allowed when |
| --- | --- |
| A class | It extends a building block, directly or through your own base class: `AggregateRoot`, `Entity`, `ValueObject`, `Identifier`, `DomainEvent`, `DomainError`, `DomainService`, a `Port` or a repository in the domain; `CommandHandler`, `QueryHandler` or `EventTranslator` in the application. |
| A function, or a constant holding one | Never. |
| An `enum` | Never. |

Types, interfaces and constants holding data are fine, and so are functions written inside a
method.

## Where the code goes instead

| Instead of | Write |
| --- | --- |
| A helper function | A method of the value object it works on, or of a `DomainService` when no object owns it. |
| A plain class (policy, calculator, specification) | A `DomainService`. |
| A factory function | A static method of the aggregate, entity or value object. |
| A mapper in the application | An `EventTranslator`, or a mapper in an adapter. |
| An `enum` | A union of literal types, or a value object when the values have behaviour. |
| `class X extends Error` | A `DomainError` returned in a `Result` for a business failure; `new Error("…")` for a bug. |

## Why

A helper function or a plain class has no defined place: the next one lands next to it, then a
`utils.ts` appears, and the model dissolves into it. When every element has to be a building
block, each one has a home that people and agents can find, and the rest of the rules know what it
is.

## What it reports

```
src/ordering/domain/services/pricing.ts:1
  building-blocks-only: PriceHelper extends no building block: extend AggregateRoot, Entity, ValueObject, Identifier, DomainEvent, DomainError, DomainService or a Port.

src/ordering/domain/services/pricing.ts:3
  building-blocks-only: The function roundAmount floats outside any class: make it a method of a value object or of a DomainService.

src/ordering/domain/services/pricing.ts:7
  building-blocks-only: The enum OrderStatus has no place here: use a union of literal types, or a ValueObject when it has behaviour.
```

## Turn it off

```ts
rules: { "building-blocks-only": "off" }
```

## See also

- [`placement`](./placement.md), for the folder of each building block
