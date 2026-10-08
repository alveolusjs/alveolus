---
description: "Architecture rule: the domain and application layers contain only building blocks, types and constants of data, with no loose function, namespace or module state."
---

# no-loose-code

The domain and the application contain building blocks, types and constants of data, and nothing
else: every class extends a building block of `@alveolus/core`, and every function is a method.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-loose-code</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A plain class, a class with only static members or that extends an expression, a function, an enum, a namespace, a computed constant, module state, a statement run on load; anything but the module class in a composition root</dd>
	<dt>Applies to</dt><dd>Files in <code>domain/</code> and <code>application/</code>, in every bounded context and the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-loose-code": "off"</code></a></dd>
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

Every top-level statement of a file in `domain/` or `application/`. The list says what is allowed;
anything else is reported:

| Statement | Allowed when |
| --- | --- |
| An `import` or an `export` | Always. |
| A `type` or an `interface`, a `declare global` block | Always. |
| A class | It extends a building block of `@alveolus/core` by its name, directly or through your own base class, and has at least one member that is not static. A mixin, a cast or a constant in `extends` hides what the class is. |
| A `const` | Its value is plain data: a literal, an array or object of data, arithmetic or a template on data, a reference to another constant, with `as const` or `satisfies` if you like. |
| A function, or a constant holding one, even wrapped in a call, parentheses or `as` | Never. |
| An object holding a method, a value computed by a call or `new`, a class expression | Never. |
| `let` or `var`: state kept by the module | Never. |
| An `enum`, a `namespace` | Never. |
| A statement run when the module loads, such as `registry.register(Order)` | Never. |

The building blocks to extend are, in the domain, `AggregateRoot`, `Entity`, `ValueObject`,
`Identifier`, `DomainEvent`, `DomainError`, `DomainService`, a `Port` or a repository; in the
application, `CommandHandler`, `QueryHandler` or `EventTranslator`.

<div class="al-cards">
<div class="al-card"><span class="al-card-title">Allowed</span>Types, interfaces and constants holding data, and functions written inside a method. A static factory next to instance members.</div>
<div class="al-card"><span class="al-card-title">Composition roots</span>Its module class, imports and constants of data: a function, a computed constant or a statement around it is reported.</div>
<div class="al-card"><span class="al-card-title">Adapter layers</span><code>driven/</code> and <code>driving/</code> hold classes: adapters, mappers, controllers, any class. A function, a computed constant or module state is reported there too.</div>
<div class="al-card"><span class="al-card-title">Not checked</span>The files at the root of <code>src/</code>, such as <code>main.ts</code>.</div>
</div>

## What it reports

```
src/ordering/domain/services/pricing.ts
  1  tactical/no-loose-code: PriceHelper extends no building
  block: extend AggregateRoot, Entity, ValueObject, Identifier,
  DomainEvent, DomainError, DomainService or a Port.
  3  tactical/no-loose-code: The function roundAmount floats
  outside any class: make it a method of a value object or of
  a DomainService.
  7  tactical/no-loose-code: The enum OrderStatus has no place
  here: use a union of literal types, or a ValueObject when it
  has behaviour.
  12  tactical/no-loose-code: The constant Pricing is computed when
  the module loads: keep top-level constants to plain data.

src/ordering/domain/value-objects/utils.value-object.ts
  3  tactical/no-loose-code: Utils only has static members: a class
  of functions is no building block; make them methods of the
  value object they work on, or of a DomainService.
```

In the application, the message lists `CommandHandler, QueryHandler or EventTranslator`.

## Fix it

### Find the building block it belongs to

So that each piece of logic has a known home, replace each declaration with the building block that
owns it:

| Instead of | Write |
| --- | --- |
| A helper function, an object or a namespace of functions, a class of static helpers | A method of the value object it works on, or of a `DomainService` when no object owns it. |
| A plain class (policy, calculator, specification) | A `DomainService`. |
| A factory function | A static method of the aggregate, entity or value object. |
| A mapper in the application | An `EventTranslator`, or a mapper in an adapter. |
| An `enum` | A union of literal types, or a value object when the values have behaviour. |
| A constant built by `new Currency("EUR")` | A static getter of the value object: `Currency.euro`. |
| A counter or a cache in a module | State of an aggregate, or a port implemented by an adapter. |

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
`Error`: it is a `DomainError`, returned in a [`Result`](../../core/utilities/result.md). A
technical failure is thrown by an adapter, never by the domain.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/errors/price-too-high.error.ts]
export class PriceTooHigh extends Error {}
```

```ts [✅ Prefer: src/ordering/domain/errors/price-too-high.error.ts]
import { DomainError } from "@alveolus/core";

export class PriceTooHigh extends DomainError<{ readonly max: number }> {}
```

</div>

## Limits

::: warning What the rule cannot see
- The methods of the module class in a composition root are not read: a business rule written in
  `OrderingModule.discount()` goes unnoticed. The module only wires.
- A constant may refer to a class, such as `[PlaceOrderHandler, GetOrderSummaryHandler]`: classes
  are values that cannot be called, so they count as data.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-loose-code": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new code keeps to building blocks while you move the old helpers.

## See also

- [Building blocks](../../core/index.md), what each class can extend
- [`tactical/no-misplaced-class`](./no-misplaced-class.md), for the folder of each building block
- [`tactical/no-thrown-failure`](./no-thrown-failure.md), for business failures
- [Rules](../index.md), every rule by category
