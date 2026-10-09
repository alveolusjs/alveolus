---
description: "Architecture rule: an aggregate refers to another aggregate by its identifier, never by holding it, to keep transactions and loading small."
---

# no-aggregate-reference

An aggregate refers to another aggregate by its identifier, never by holding it.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-aggregate-reference</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A building block holding another aggregate, an entity held by two aggregates</dd>
	<dt>Applies to</dt><dd>Every class that extends <code>AggregateRoot</code>, <code>Entity</code>, <code>ValueObject</code> or <code>DomainEvent</code>, in core bounded contexts and the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-aggregate-reference": "off"</code></a></dd>
</dl>

## Why

`Order` holds a `Customer`. The next handler that places an order also updates the customer, in
the same transaction, because it is right there. Loading an order now drags the customer along,
two users editing either one conflict, and the two boundaries have merged without anyone deciding
it.

::: tip The fix
The order keeps a `CustomerId`. Each aggregate stays a consistency boundary of its own, loaded,
changed and saved alone. The command handler loads the customer when it really needs it, and
changes to it happen in their own transaction, usually in reaction to an event.
:::

## What it checks

### No aggregate held

In every aggregate, entity, value object and domain event, no property, no constructor parameter,
no value object props and no event payload holds another aggregate, however deep it is:

<div class="al-cards">
<div class="al-card"><span class="al-card-title">Alone or in a union</span><code>customer: Customer | undefined</code></div>
<div class="al-card"><span class="al-card-title">In a generic</span>An array, a tuple, a <code>Map</code>, a <code>Record</code>, a <code>Pick</code>, a <code>Promise</code>, or a generic of your own.</div>
<div class="al-card"><span class="al-card-title">In an object type</span><code>{ customer: Customer }</code>, or an interface of the project.</div>
<div class="al-card"><span class="al-card-title">Loaded lazily</span><code>load: () =&gt; Promise&lt;Customer&gt;</code>: what a function returns counts.</div>
<div class="al-card"><span class="al-card-title">In value object props</span><code>ValueObject&lt;{ customer: Customer }&gt;</code></div>
<div class="al-card"><span class="al-card-title">In an event payload</span><code>DomainEvent&lt;OrderId, { customer: Customer }&gt;</code></div>
</div>

The parameters of a function do not count: `onChange: (customer: Customer) => void` receives a
customer, it does not hold one.

### One owner per entity

An entity other than a root belongs to one aggregate. The rule finds every entity each aggregate
holds, directly or through its entities and value objects, and reports an entity held by two
aggregates: the `Address` of a `Customer` cannot be held by an `Order` too.

## What it reports

```
src/ordering/domain/aggregates/order.aggregate.ts
  6  error  tactical/no-aggregate-reference: Order.customer holds the
  aggregate Customer: reference it by its identifier instead.

src/ordering/domain/value-objects/buyer.value-object.ts
  3  error  tactical/no-aggregate-reference: Buyer holds the aggregate
  Customer in its Props: reference it by its identifier instead.

src/ordering/domain/aggregates/order.aggregate.ts
  8  error  tactical/no-aggregate-reference: Order.shipping holds the entity
  Address, which Customer holds too: an entity belongs to one
  aggregate.
```

## Fix it

### Hold the identifier instead

So that each aggregate stays its own boundary, replace the property with the
[identifier](../../core/domain/value-objects.md#identifier) of the other aggregate, and put that
identifier in the snapshot.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot } from "@alveolus/core";

import type { Customer } from "./customer.aggregate";

export class Order extends AggregateRoot<OrderId> {
	private readonly customer: Customer;
}
```

```ts [✅ Prefer: src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot } from "@alveolus/core";

import type { CustomerId } from "../value-objects/customer-id.identifier";

export class Order extends AggregateRoot<OrderId> {
	private readonly customerId: CustomerId;
}
```

</div>

### Give each aggregate its own entity

When two aggregates need the same kind of data, each one owns its own: the customer keeps its
`Address` entity, the order keeps a `ShippingAddress` value object copied from it when the order
is placed. Changing the customer's address no longer changes past orders.

### Load the other aggregate in the handler

When a rule needs data from the other aggregate, the
[command handler](../../core/application/command-handlers.md) loads it through its repository and
passes what the rule needs to the business method. When the other aggregate must change too, a
second handler does it on the event, in its own transaction.

## Limits

::: warning What the rule cannot see
- An interface with the shape of another aggregate, such as `CustomerLike`: TypeScript types are
  structural, so the rule cannot tell that a `Customer` will be passed in. Hold the identifier.
- The parameters of a callback are not followed: `onChange: (customer: Customer) => void` is
  accepted, and a closure can still capture the aggregate it receives.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-aggregate-reference": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new code keeps the rule while you rework the old references.

## See also

- [Aggregates: refer to other aggregates by identity](../../core/domain/aggregates.md)
- [`tactical/no-thrown-failure`](./no-thrown-failure.md), another rule on aggregates
- [Rules](../index.md), every rule by category
