# Ports

A port is what the domain needs from the outside world, said in its own words: the current date, a
payment gateway, the prices of another bounded context. The domain declares it as an abstract
class; a driven adapter implements it with a technology.

```ts
export abstract class PriceList extends Port {
	abstract priceOf(productId: ProductId): Promise<Money | undefined>;
}
```

## When to use

Declare a port for every dependency that leaves the bounded context: a clock, an id generator, a
payment provider, an email sender, a read from another context. Persistence is the one exception:
loading and saving go through [repositories](./repositories.md), which are ports too.

`@alveolus/core` already ships two ports every project needs, because domain events receive their
id and their date from the caller: `Clock` and `IdGenerator`.

## Usage

### Declare a port

Extend `Port` in `domain/ports/` with the abstract methods the use cases need. Name it after what
the domain needs, not after the technology or the provider.

```ts [src/ordering/domain/ports/price-list.port.ts]
import { Port } from "@alveolus/core";

import type { Money } from "../value-objects/money.value-object";
import type { ProductId } from "../value-objects/product-id.identifier";

export abstract class PriceList extends Port {
	abstract priceOf(productId: ProductId): Promise<Money | undefined>;
}
```

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/ports/stripe-client.port.ts]
export abstract class StripeClient extends Port {
	abstract createPaymentIntent(params: Stripe.PaymentIntentCreateParams): Promise<Stripe.PaymentIntent>;
}
```

```ts [✅ Prefer: src/ordering/domain/ports/payments.port.ts]
export abstract class Payments extends Port {
	abstract charge(orderId: OrderId, amount: Money): Promise<Result<void, PaymentDeclined>>;
}
```

</div>

::: details Why?
A port named and typed after a provider drags that provider into the domain: its vocabulary, its
types, its quirks. A port in the language of the domain lets you change provider by writing a new
adapter, without touching a single use case.
:::

### Implement it in a driven adapter

The adapter extends the port, in `driven/<technology>/adapters/`
([`driven-adapters-extend-port`](../../rules/driven-adapters-extend-port.md)).

```ts [src/ordering/driven/stripe/adapters/stripe-payments.adapter.ts]
import { err, ok, type Result } from "@alveolus/core";

import { PaymentDeclined } from "../../../domain/errors/payment-declined.error";
import { Payments } from "../../../domain/ports/payments.port";
import type { Money } from "../../../domain/value-objects/money.value-object";
import type { OrderId } from "../../../domain/value-objects/order-id.identifier";

export class StripePayments extends Payments {
	constructor(private readonly stripe: Stripe) {
		super();
	}

	async charge(orderId: OrderId, amount: Money): Promise<Result<void, PaymentDeclined>> {
		const intent = await this.stripe.paymentIntents.create({ amount: amount.cents, currency: amount.currency, metadata: { orderId: orderId.value } });
		return intent.status === "succeeded" ? ok() : err(new PaymentDeclined({ orderId: orderId.value }));
	}
}
```

### Use the clock and the id generator

The domain never reads the clock nor generates ids. The command handler gets them from `Clock` and
`IdGenerator`, and passes them to the aggregate.

```ts [src/ordering/application/commands/place-order.command.ts]
const placed = order.place(total, this.ids.next(), this.clock.now());
```

Their adapters live in the shared kernel, once for every bounded context:

```ts [src/shared-kernel/driven/system/adapters/system-clock.adapter.ts]
import { Clock } from "@alveolus/core";

export class SystemClock extends Clock {
	now(): Date {
		return new Date();
	}
}
```

```ts [src/shared-kernel/driven/node/adapters/random-id-generator.adapter.ts]
import { randomUUID } from "node:crypto";

import { IdGenerator } from "@alveolus/core";

export class RandomIdGenerator extends IdGenerator {
	next(): string {
		return randomUUID();
	}
}
```

In tests, a fixed clock and a sequential generator make every date and id predictable.

### Wire it in the composition root

A port is a class: it exists at runtime and serves as its own injection token. The composition root
of the bounded context picks the adapter and passes it where the port is expected:

```ts [src/ordering/ordering.module.ts]
const placeOrder = new PlaceOrderHandler(new StripePayments(stripe), new SystemClock(), new RandomIdGenerator());
```

The command handler receives `Payments`, `Clock` and `IdGenerator` in its constructor, and never
knows which adapters it got. With a container, register the adapter under the port: see
[Integrations](../../integrations/index.md).

### Serve several ports with one adapter

An adapter extends one port. When it also serves others, it lists them with `implements`:
TypeScript accepts a class there.

```ts
export class PgOrders extends Orders implements OrderSummaries { … }
```

## Reference

```ts
abstract class Port
abstract class Clock extends Port
abstract class IdGenerator extends Port
```

| Member | Type | Description |
| --- | --- | --- |
| `Clock.now()` | `Date` | The current date. |
| `IdGenerator.next()` | `string` | A new unique id. Wrap it in your identifier: `new OrderId(ids.next())`. |

`Port` has no members: extending it marks the class as a port. Everything a driven adapter
implements is a port: your own ports, the [repositories](./repositories.md), and the
[`EventPublisher`](../application/event-publishers.md), [`Outbox`](../application/outbox.md) and
[`UnitOfWork`](../application/unit-of-work.md) of core.

**Caveats**

- Ports are declared in `domain/ports/*.port.ts`, of a bounded context or of the shared kernel;
  `alveolus arch check` reports a port declared anywhere else.
- Core ships no implementation of `Clock` or `IdGenerator`: they are adapters of your project.

Import from `@alveolus/core` or `@alveolus/core/ports`.

## See also

- [Repositories](./repositories.md), the ports for persistence
- [Anti-corruption layers](../strategic/anti-corruption-layers.md), ports that read another context
- [`driven-adapters-extend-port`](../../rules/driven-adapters-extend-port.md)
- [Project layout](../../guide/project-layout.md)
