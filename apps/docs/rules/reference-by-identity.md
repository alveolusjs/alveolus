# reference-by-identity

An aggregate refers to another aggregate by its identifier, never by holding it. Each aggregate
stays a consistency boundary of its own, loaded, changed and saved alone.

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

## What it checks

In every class that extends `AggregateRoot` or `Entity`, no property and no constructor parameter is
typed with another aggregate: not alone, not in an array, a `Map`, a `Set`, a `Promise` or a union.

## Why

An aggregate that holds another one invites changing both in the same transaction, loading one
drags the other along, and the two boundaries merge without anyone deciding it. Holding the
identifier keeps them apart: the command handler loads the other aggregate when it really needs it,
and changes to it happen in their own transaction, usually in reaction to an event.

## What it reports

```
src/ordering/domain/aggregates/order.aggregate.ts:6
  reference-by-identity: Order.customer holds the aggregate Customer: reference it by its identifier instead.
```

## Turn it off

```ts
rules: { "reference-by-identity": "off" }
```

## See also

- [`errors-as-values`](./errors-as-values.md), another rule on aggregates
