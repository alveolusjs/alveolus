# Domain Services

A domain service holds a business operation that belongs to no single object: computing the
shipping cost of an order, checking that a transfer between two accounts is allowed. It is
stateless, speaks the language of the domain and returns a `Result`.

```ts
export class ShippingCost extends DomainService {
	costOf(order: Order): Result<Money, UnsupportedDestination> { … }
}
```

## When to use

Reach for a domain service when a rule needs several aggregates, or when putting it on one of them
would make that object know about things it should not. If the operation naturally belongs to an
aggregate, an entity or a value object, make it a method there instead: a domain service is the
exception, not the default home for logic.

It is also where a helper function goes. Free functions and plain classes are not allowed in the
domain ([`building-blocks-only`](../../rules/building-blocks-only.md)): a calculation that no
value object owns becomes a method of a domain service.

## Usage

### Declare a domain service

Extend `DomainService` in `domain/services/`. Methods take domain objects and return a `Result`
when the operation can fail.

```ts [src/ordering/domain/services/shipping-cost.service.ts]
import { DomainService, err, ok, type Result } from "@alveolus/core";

import type { Order } from "../aggregates/order.aggregate";
import { UnsupportedDestination } from "../errors/unsupported-destination.error";
import { Money } from "../value-objects/money.value-object";

export class ShippingCost extends DomainService {
	constructor(
		private readonly freeAbove: number,
		private readonly flatRate: number,
	) {
		super();
	}

	costOf(order: Order): Result<Money, UnsupportedDestination> {
		if (!order.isDomestic) {
			return err(new UnsupportedDestination({ country: order.country }));
		}
		return ok(Money.of(order.total.amount >= this.freeAbove ? 0 : this.flatRate));
	}
}
```

### Keep it stateless

A domain service may hold configuration in `readonly` fields, such as a rate or a threshold. It
never holds an aggregate, an entity or anything that changes between calls.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/services/shipping-cost.service.ts]
export class ShippingCost extends DomainService {
	private order: Order | undefined;

	select(order: Order): void {
		this.order = order;
	}
}
```

```ts [✅ Prefer: src/ordering/domain/services/shipping-cost.service.ts]
export class ShippingCost extends DomainService {
	constructor(private readonly flatRate: number) {
		super();
	}

	costOf(order: Order): Result<Money, UnsupportedDestination> { … }
}
```

</div>

::: details Why?
A service that keeps state between calls depends on the order of those calls and cannot be shared
safely. Passing everything as parameters keeps it a plain function of the domain, easy to test and
to reason about.
:::

### Call it from a command handler

The command handler loads the aggregates, asks the service, and passes its answer to the
aggregate. The service never loads, saves or publishes anything.

```ts [src/ordering/application/commands/place-order.command.ts]
const shipping = this.shippingCost.costOf(order);
if (!shipping.ok) {
	return shipping;
}
const placed = order.place(shipping.value, this.ids.next(), this.clock.now());
```

### Build it in the composition root

The domain imports no framework, so a domain service has no decorator. The composition root builds
it with its configuration and passes it to the handlers that need it:

```ts [src/ordering/ordering.module.ts]
const shippingCost = new ShippingCost(5000, 490);
```

With a container, register that instance: see [Integrations](../../integrations/index.md).

## Reference

```ts
abstract class DomainService
```

`DomainService` has no members: extending it marks the class as a domain service, for you and for
`alveolus arch check`.

**Caveats**

- A domain service is not an application service: it never loads, saves or publishes. That is the
  job of a [command handler](../application/command-handlers.md).
- It may hold configuration in `readonly` fields, never an aggregate or an entity.
- It lives in `domain/services/*.service.ts` ([`placement`](../../rules/placement.md)).

Import from `@alveolus/core` or `@alveolus/core/domain-services`.

## See also

- [Aggregates](./aggregates.md), where most rules belong
- [Value Objects](./value-objects.md), the other home for calculations
- [Command handlers](../application/command-handlers.md), which call domain services
- [`building-blocks-only`](../../rules/building-blocks-only.md)
