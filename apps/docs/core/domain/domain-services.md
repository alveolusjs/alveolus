# Domain Services

A domain service holds a domain operation that does not belong to a single entity or value object,
such as a calculation that involves several aggregates. It is stateless: it works only on what it
receives.

```ts
export class ShippingCostCalculator extends DomainService {
	costOf(order: Order, destination: Address): Result<Money, UnsupportedDestination> { … }
}
```

## When to use

Use a domain service when an operation is part of the business language but would be awkward on any
one object: it needs two aggregates, or it is a calculation no aggregate owns. Keep it the
exception: behaviour that fits an aggregate or a value object belongs there. Use cases that load,
save or notify are application code, not domain services.

## Usage

### Declare a domain service

Extend `DomainService` in the `domain/services/` folder and name the class after an activity of the
domain. Methods take the aggregates and values they work on as parameters, and return a value or a
[`Result`](../utilities/result.md).

```ts [src/ordering/domain/services/shipping-cost-calculator.service.ts]
import { DomainService, err, ok, type Result } from "@alveolus/core";
import type { Order } from "../aggregates/order.aggregate.ts";
import { UnsupportedDestination } from "../errors/shipping.error.ts";
import type { Address } from "../value-objects/address.value-object.ts";
import { Money } from "../../../shared-kernel/domain/value-objects/money.value-object.ts";

export class ShippingCostCalculator extends DomainService {
	costOf(order: Order, destination: Address): Result<Money, UnsupportedDestination> {
		if (destination.country !== "FR") {
			return err(new UnsupportedDestination({ country: destination.country }));
		}
		return Money.create(order.weight > 2 ? 9 : 5, euro);
	}
}
```

### Configure it

A domain service may receive values or other domain services at construction, kept in `readonly`
fields.

```ts
export class ShippingCostCalculator extends DomainService {
	private readonly freeShippingFrom: Money;

	constructor(freeShippingFrom: Money) {
		super();
		this.freeShippingFrom = freeShippingFrom;
	}
}
```

### Call it from a use case

The application layer loads the aggregates, calls the service and uses its result.

```ts
const order = await orders.findById(orderId);
if (order === undefined) {
	return err(new OrderNotFound({ id: orderId.value }));
}
const cost = shipping.costOf(order, address);
if (!cost.ok) {
	return cost;
}
```

## Reference

```ts
abstract class DomainService
```

`DomainService` has no members: extending it marks the class as a domain service, so that
`alveolus arch check` applies its rules.

Import from `@alveolus/core` or `@alveolus/core/domain-services`.

## See also

- [Aggregates](./aggregates.md), where most behaviour belongs
- [Policies](./policies.md), for rules that accept or refuse
- [Domain service rules](/arch/rules/domain-services), checked by `alveolus arch check`
