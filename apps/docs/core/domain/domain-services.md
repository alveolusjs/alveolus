---
description: "Domain services in Domain-Driven Design with TypeScript: stateless classes that hold a business rule no single aggregate or value object owns."
---

# Domain Services

A domain service is a stateless class of the domain that holds a business rule no single object
owns.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain</dd>
	<dt>File</dt><dd><code>domain/services/order-limit.service.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>DomainService</code></a></dd>
	<dt>Called by</dt><dd><a href="/core/application/command-handlers">Command handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/tactical/no-loose-code"><code>tactical/no-loose-code</code></a>, <a href="/rules/layers/no-impure-domain"><code>layers/no-impure-domain</code></a>, <a href="/rules/tactical/no-stateful-service"><code>tactical/no-stateful-service</code></a></dd>
</dl>

## Why

A new customer may not place an order of more than 5 lines. The rule needs the customer and the
order. Put it in `Order`, and the order must hold the `Customer`: two aggregates merge. Put it in
the command handler, and the rule leaves the domain, copied in every handler that places orders.

::: tip The fix
A domain service holds the rule: `OrderLimit` takes the order and the customer, and answers with a
`Result`. The rule stays in the domain, in one place, and neither aggregate holds the other.
:::

## How it works

A domain service is a plain function of the domain, written as a class: it keeps nothing between
calls. It never loads, saves or publishes: the command handler does that, and hands the service
what it needs.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Receive</span>The aggregates and values the rule needs, as parameters.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Decide</span>Apply the rule, in the words of the domain.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Answer</span>Return a <a href="/core/utilities/result"><code>Result</code></a>: a value, or a <a href="/core/domain/domain-errors">domain error</a>.</div>
</div>

```ts
check(order: Order, customer: Customer): Result<void, OrderTooLarge> {
	if (!customer.isNew) {
		return ok();
	}
	if (order.lineCount <= this.maxLinesForNewCustomers) {
		return ok();
	}
	return err(new OrderTooLarge({ limit: this.maxLinesForNewCustomers }));
}
```

## Where it fits

The [command handler](../application/command-handlers.md) loads both aggregates, asks the service,
and only then calls the aggregate it changes.

<div class="al-diagram">
<svg viewBox="0 0 680 380" role="img" aria-label="The PlaceOrderHandler loads the Order and the Customer, asks the OrderLimit domain service, then places the order and saves it.">
	<defs>
		<marker id="service-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="162" width="130" height="56" rx="8" />
	<text class="label" x="73" y="186" text-anchor="middle">Controller</text>
	<text class="note" x="73" y="206" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 190 L 178 190" marker-end="url(#service-flow-arrow)" />
	<rect class="box" x="180" y="162" width="180" height="56" rx="8" />
	<text class="label" x="270" y="186" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="270" y="206" text-anchor="middle">command handler</text>
	<rect class="box" x="440" y="24" width="232" height="48" rx="8" />
	<text class="label" x="556" y="44" text-anchor="middle">1 · orders.findById(…)</text>
	<text class="note" x="556" y="62" text-anchor="middle">loads the Order</text>
	<rect class="box" x="440" y="92" width="232" height="48" rx="8" />
	<text class="label" x="556" y="112" text-anchor="middle">2 · customers.findById(…)</text>
	<text class="note" x="556" y="130" text-anchor="middle">loads the Customer</text>
	<rect class="boundary" x="440" y="160" width="232" height="48" rx="8" />
	<text class="label" x="556" y="180" text-anchor="middle">3 · orderLimit.check(…)</text>
	<text class="note" x="556" y="198" text-anchor="middle">this page: rule on both</text>
	<rect class="box" x="440" y="228" width="232" height="48" rx="8" />
	<text class="label" x="556" y="248" text-anchor="middle">4 · order.place(…)</text>
	<text class="note" x="556" y="266" text-anchor="middle">changes the Order</text>
	<rect class="box" x="440" y="296" width="232" height="48" rx="8" />
	<text class="label" x="556" y="316" text-anchor="middle">5 · orders.save(order)</text>
	<text class="note" x="556" y="334" text-anchor="middle">stores it</text>
	<path class="link" d="M 360 190 L 438 48" marker-end="url(#service-flow-arrow)" />
	<path class="link" d="M 360 190 L 438 116" marker-end="url(#service-flow-arrow)" />
	<path class="link" d="M 360 190 L 438 184" marker-end="url(#service-flow-arrow)" />
	<path class="link" d="M 360 190 L 438 252" marker-end="url(#service-flow-arrow)" />
	<path class="link" d="M 360 190 L 438 320" marker-end="url(#service-flow-arrow)" />
</svg>
</div>

::: tip
The service reads two aggregates but changes none of them. Only `Order` changes, in one
transaction.
:::

## API

```ts
import { DomainService } from "@alveolus/core";
// or: import { DomainService } from "@alveolus/core/domain-services";
```

### Declaration

```ts
abstract class DomainService {}
```

`DomainService` has no members: extending it marks the class as a domain service, for you and for
`alveolus arch check`.

### `constructor(…)` <Badge type="info" text="optional" /> <Badge type="tip" text="you write it" />

```ts
constructor(private readonly limit: number)
```

Takes configuration, such as a limit or a rate, in `readonly` fields, and calls `super()`.

### Your methods <Badge type="tip" text="called by the command handler" />

```ts
check(order: Order, customer: Customer): Result<void, OrderTooLarge>
```

Take domain objects and return a `Result` when the rule can refuse.

::: warning Caveats
- A domain service is not an application service: it never loads, saves or publishes. That is the
  job of a [command handler](../application/command-handlers.md).
- It may hold configuration in `readonly` fields, never an aggregate or an entity.
:::

## Usage

Build `OrderLimit`, a rule that needs two aggregates, then call it from the handler that places an
order. Each step shows the whole file it changes: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-find-the-rule">Find the rule</a></span>One that belongs to no aggregate.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-service">Declare the service</a></span>A home named after the rule.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-check-the-rule">Check the rule</a></span>Aggregates in, a Result out.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-call-it-from-a-handler">Call it from a handler</a></span>Load, check, then change.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Find the rule

A new customer may not place an order with more than a few lines: the rule needs the
[`Order`](./aggregates.md) and the `Customer`, and belongs to neither.

### 2. Declare the service

So that the rule has a home in the domain, it gets a class of its own, named after the rule. Its
settings come in through the constructor.

```ts [src/ordering/domain/services/order-limit.service.ts]
import { DomainService } from "@alveolus/core";

export class OrderLimit extends DomainService {
	constructor(private readonly maxLinesForNewCustomers: number) {
		super();
	}
}
```

### 3. Check the rule

The service takes the aggregates as parameters and changes neither. Like an aggregate, it returns
the failure in a `Result`.

```ts [src/ordering/domain/services/order-limit.service.ts]
import { DomainService } from "@alveolus/core"; // [!code --]
import { DomainService, err, ok, type Result } from "@alveolus/core"; // [!code ++]

import type { Customer } from "../aggregates/customer.aggregate"; // [!code ++]
import type { Order } from "../aggregates/order.aggregate"; // [!code ++]
import { OrderTooLarge } from "../errors/order-too-large.error"; // [!code ++]

export class OrderLimit extends DomainService {
	constructor(private readonly maxLinesForNewCustomers: number) {
		super();
	}

	check( // [!code ++]
		order: Order, // [!code ++]
		customer: Customer, // [!code ++]
	): Result<void, OrderTooLarge> { // [!code ++]
		if (!customer.isNew) { // [!code ++]
			return ok(); // [!code ++]
		} // [!code ++]
		if (order.lineCount <= this.maxLinesForNewCustomers) { // [!code ++]
			return ok(); // [!code ++]
		} // [!code ++]
		return err( // [!code ++]
			new OrderTooLarge({ limit: this.maxLinesForNewCustomers }), // [!code ++]
		); // [!code ++]
	} // [!code ++]
}
```

### 4. Call it from a handler

The [command handler](../application/command-handlers.md) loads the order and the customer, asks
the service, and only then changes the order. The composition root sets the limit with
`new OrderLimit(5)`.

```ts [src/ordering/application/commands/place-order.command.ts]
const allowed = this.orderLimit.check(order, customer);
if (!allowed.ok) {
	return allowed;
}
const placed = order.place(this.ids.next(), this.clock.now());
```

### 5. Check it

Run the checks. Three rules keep the service the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-loose-code"><code>no-loose-code</code></a></span>The rule is a method of a <code>DomainService</code>, not a free function.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>domain/services/*.service.ts</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-impure-domain"><code>no-impure-domain</code></a></span>It imports the domain only: no adapter, no framework.</div>
</div>

The same rule written as a function is reported:

```
src/ordering/domain/services/order-limit.ts
  5  error  tactical/no-loose-code: The function checkOrderLimit floats
  outside any class: make it a method of a value object or of a
  DomainService.
```

## See also

- [Aggregates](./aggregates.md), where most rules belong
- [Value objects](./value-objects.md), the other home for calculations
- [Command handlers](../application/command-handlers.md), which call domain services
- Rules: [`tactical/no-loose-code`](../../rules/tactical/no-loose-code.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
- Vaughn Vernon, *Implementing Domain-Driven Design*, chapter 7, "Services"
