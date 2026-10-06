---
description: "Architecture rule: an aggregate refers to another aggregate by its identifier, never by holding it, to keep transactions and loading small."
---

# no-aggregate-reference

An aggregate refers to another aggregate by its identifier, never by holding it.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-aggregate-reference</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A property or constructor parameter typed with another aggregate</dd>
	<dt>Applies to</dt><dd>Every class that extends <code>AggregateRoot</code> or <code>Entity</code></dd>
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

In every class that extends `AggregateRoot` or `Entity`, no property and no constructor parameter is
typed with another aggregate:

<div class="al-cards">
<div class="al-card"><span class="al-card-title">Alone</span><code>customer: Customer</code></div>
<div class="al-card"><span class="al-card-title">In a collection</span>An array, a <code>Map</code>, a <code>Set</code> or a <code>Promise</code> of <code>Customer</code>.</div>
<div class="al-card"><span class="al-card-title">In a union</span><code>customer: Customer | undefined</code></div>
</div>

An entity inside an aggregate follows the same rule: an `OrderLine` cannot hold a `Customer`
either.

## What it reports

```
src/ordering/domain/aggregates/order.aggregate.ts:6
  tactical/no-aggregate-reference: Order.customer holds the
  aggregate Customer: reference it by its identifier instead.
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

### Load the other aggregate in the handler

When a rule needs data from the other aggregate, the
[command handler](../../core/application/command-handlers.md) loads it through its repository and
passes what the rule needs to the business method. When the other aggregate must change too, a
second handler does it on the event, in its own transaction.

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
