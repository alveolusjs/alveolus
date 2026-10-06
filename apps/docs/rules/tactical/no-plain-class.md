---
description: "Architecture rule: the domain and application layers contain only building blocks, every class extending one from @alveolus/core."
---

# no-plain-class

The domain and the application contain building blocks, and nothing else: every class extends one
from `@alveolus/core`.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-plain-class</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A plain class, a free function or an enum</dd>
	<dt>Applies to</dt><dd>Files in <code>domain/</code> and <code>application/</code>, in every bounded context and the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-plain-class": "off"</code></a></dd>
</dl>

## Why

Rounding an amount needs a few lines, so a `roundAmount` function lands in `pricing.ts`. The next
helper goes next to it, then a `utils.ts` appears, and the model slowly dissolves into code that has
no defined place and that no other rule knows how to treat.

::: tip The fix
Every element of the domain and the application is a building block. Rounding belongs to `Money`,
a value object; a rule that no object owns goes in a `DomainService`. Each one has a home that
people and agents can find, and the rest of the rules know what it is.
:::

## What it checks

Every top-level declaration of a file in `domain/` or `application/`:

| Declaration | Allowed when |
| --- | --- |
| A class | It extends a building block of `@alveolus/core`, directly or through your own base class. |
| A function, or a constant holding one | Never. |
| An `enum` | Never. |

The building blocks to extend are, in the domain, `AggregateRoot`, `Entity`, `ValueObject`,
`Identifier`, `DomainEvent`, `DomainError`, `DomainService`, a `Port` or a repository; in the
application, `CommandHandler`, `QueryHandler` or `EventTranslator`.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title">Allowed</span>Types, interfaces and constants holding data, and functions written inside a method.</div>
<div class="al-card"><span class="al-card-title">Not checked</span>Adapters in <code>driven/</code> and <code>driving/</code>, and composition roots: they may hold any class or function.</div>
</div>

## What it reports

```
src/ordering/domain/services/pricing.ts:1
  tactical/no-plain-class: PriceHelper extends no building
  block: extend AggregateRoot, Entity, ValueObject, Identifier,
  DomainEvent, DomainError, DomainService or a Port.

src/ordering/domain/services/pricing.ts:3
  tactical/no-plain-class: The function roundAmount floats
  outside any class: make it a method of a value object or of
  a DomainService.

src/ordering/domain/services/pricing.ts:7
  tactical/no-plain-class: The enum OrderStatus has no place
  here: use a union of literal types, or a ValueObject when it
  has behaviour.
```

In the application, the message lists `CommandHandler, QueryHandler or EventTranslator`.

## Fix it

### Find the building block it belongs to

So that each piece of logic has a known home, replace each declaration with the building block that
owns it:

| Instead of | Write |
| --- | --- |
| A helper function | A method of the value object it works on, or of a `DomainService` when no object owns it. |
| A plain class (policy, calculator, specification) | A `DomainService`. |
| A factory function | A static method of the aggregate, entity or value object. |
| A mapper in the application | An `EventTranslator`, or a mapper in an adapter. |
| An `enum` | A union of literal types, or a value object when the values have behaviour. |

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
```

```ts [✅ Prefer: src/ordering/domain/value-objects/money.value-object.ts]
import { ValueObject } from "@alveolus/core";

export class Money extends ValueObject<{ readonly amount: number }> {
	rounded(): Money {
		return new Money({
			amount: Math.round(this.props.amount * 100) / 100,
		});
	}
}
```

</div>

### Return business failures as domain errors

So that callers see in the signature what can go wrong, a business failure is not a subclass of
`Error`: it is a `DomainError`, returned in a [`Result`](../../core/utilities/result.md). A bug
stays a plain `new Error("…")`, thrown.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/errors/price-too-high.error.ts]
export class PriceTooHigh extends Error {}
```

```ts [✅ Prefer: src/ordering/domain/errors/price-too-high.error.ts]
import { DomainError } from "@alveolus/core";

export class PriceTooHigh extends DomainError<{ readonly max: number }> {}
```

</div>

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-plain-class": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new code keeps to building blocks while you move the old helpers.

## See also

- [Building blocks](../../core/index.md), what each class can extend
- [`tactical/no-misplaced-class`](./no-misplaced-class.md), for the folder of each building block
- [`tactical/no-thrown-failure`](./no-thrown-failure.md), for business failures
- [Rules](../index.md), every rule by category
