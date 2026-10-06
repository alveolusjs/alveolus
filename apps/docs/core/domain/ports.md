---
description: "Ports in hexagonal architecture with TypeScript: abstract classes through which the domain states what it needs from the outside world, in its own words."
---

# Ports

A port is an abstract class through which the domain says, in its own words, what it needs from
the outside world.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain, implemented by a driven adapter</dd>
	<dt>File</dt><dd><code>domain/ports/payments.port.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>Port</code></a></dd>
	<dt>Used by</dt><dd><a href="/core/application/command-handlers">Command handlers</a>, <a href="/core/application/query-handlers">query handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/layers/no-portless-adapter"><code>layers/no-portless-adapter</code></a>, <a href="/rules/layers/no-impure-domain"><code>layers/no-impure-domain</code></a></dd>
</dl>

## Why

Placing an order records an event with an id and a date. If the domain calls `randomUUID()` and
`new Date()` itself, no test can predict the event. The same goes for a payment: if the use case
calls the Stripe SDK, it speaks Stripe, and changing provider means rewriting it.

::: tip The fix
The domain declares a port for each need: `Clock`, `IdGenerator`, `Payments`. The handler receives
the port; a driven adapter implements it with a technology. Tests pass a fixed clock, production
passes the system clock, and the use case never knows which.
:::

## How it works

A port is the contract; an adapter is one way to fulfil it. The domain owns the contract, so it
never depends on a technology: the dependency points inwards.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Declare</span>The domain extends <code>Port</code> with abstract methods, named after what it needs.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Implement</span>A driven adapter extends the port and does the work with a library, a database or an API.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Wire</span>The composition root passes the adapter where the port is expected.</div>
</div>

```ts
export abstract class Payments extends Port {
	abstract charge(
		orderId: OrderId,
		amount: Money,
	): Promise<Result<void, PaymentDeclined>>;
}
```

`@alveolus/core` ships two ports every project needs, `Clock` and `IdGenerator`, and builds its
other contracts on `Port`: [repositories](./repositories.md), the
[`Outbox`](../application/outbox.md), the [`UnitOfWork`](../application/unit-of-work.md) and the
[`EventPublisher`](../application/event-publishers.md).

## Where it fits

The command handler receives ports in its constructor and calls them. Each port is implemented by
an adapter in `driven/`.

<div class="al-diagram">
<svg viewBox="0 0 680 250" role="img" aria-label="The PlaceOrderHandler calls the Clock, IdGenerator and Orders ports, declared in the domain. The SystemClock, RandomIdGenerator and PgOrders adapters, in driven, extend them.">
	<defs>
		<marker id="ports-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<text class="note" x="93" y="24" text-anchor="middle">application</text>
	<text class="note" x="335" y="24" text-anchor="middle">domain: ports</text>
	<text class="note" x="586" y="24" text-anchor="middle">driven: adapters</text>
	<rect class="box" x="8" y="112" width="170" height="56" rx="8" />
	<text class="label" x="93" y="136" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="93" y="156" text-anchor="middle">command handler</text>
	<rect class="boundary" x="250" y="44" width="170" height="48" rx="8" />
	<text class="label" x="335" y="64" text-anchor="middle">Clock</text>
	<text class="note" x="335" y="82" text-anchor="middle">port</text>
	<rect class="boundary" x="250" y="116" width="170" height="48" rx="8" />
	<text class="label" x="335" y="136" text-anchor="middle">IdGenerator</text>
	<text class="note" x="335" y="154" text-anchor="middle">port</text>
	<rect class="boundary" x="250" y="188" width="170" height="48" rx="8" />
	<text class="label" x="335" y="208" text-anchor="middle">Orders</text>
	<text class="note" x="335" y="226" text-anchor="middle">repository, a port</text>
	<rect class="box" x="500" y="44" width="172" height="48" rx="8" />
	<text class="label" x="586" y="64" text-anchor="middle">SystemClock</text>
	<text class="note" x="586" y="82" text-anchor="middle">adapter</text>
	<rect class="box" x="500" y="116" width="172" height="48" rx="8" />
	<text class="label" x="586" y="136" text-anchor="middle">RandomIdGenerator</text>
	<text class="note" x="586" y="154" text-anchor="middle">adapter</text>
	<rect class="box" x="500" y="188" width="172" height="48" rx="8" />
	<text class="label" x="586" y="208" text-anchor="middle">PgOrders</text>
	<text class="note" x="586" y="226" text-anchor="middle">adapter</text>
	<path class="link" d="M 178 140 L 248 68" marker-end="url(#ports-arrow)" />
	<path class="link" d="M 178 140 L 248 140" marker-end="url(#ports-arrow)" />
	<path class="link" d="M 178 140 L 248 212" marker-end="url(#ports-arrow)" />
	<path class="link" d="M 498 68 L 422 68" stroke-dasharray="4 4" marker-end="url(#ports-arrow)" />
	<path class="link" d="M 498 140 L 422 140" stroke-dasharray="4 4" marker-end="url(#ports-arrow)" />
	<path class="link" d="M 498 212 L 422 212" stroke-dasharray="4 4" marker-end="url(#ports-arrow)" />
	<text class="note" x="460" y="60" text-anchor="middle">extends</text>
</svg>
</div>

::: tip
Arrows point towards the domain: the handler calls the port, the adapter extends it. Nothing in the
domain or the application imports an adapter.
:::

## API

```ts
import { Clock, IdGenerator, Port } from "@alveolus/core";
// or: from "@alveolus/core/ports"
```

### Port

```ts
abstract class Port {}
```

`Port` has no members: extending it marks the class as a port. Declare yours abstract, in
`domain/ports/`, with the methods the use cases need; its adapter, in
`driven/<technology>/adapters/`, implements every one. Everything a driven adapter implements is
a port: your own ports, the [repositories](./repositories.md), and the
[`EventPublisher`](../application/event-publishers.md), [`Outbox`](../application/outbox.md) and
[`UnitOfWork`](../application/unit-of-work.md) of core.

### `Clock.now()` <Badge type="info" text="abstract" /> <Badge type="tip" text="called by the command handler" />

```ts
abstract now(): Date
```

The current date. `Clock` extends `Port`.

### `IdGenerator.next()` <Badge type="info" text="abstract" /> <Badge type="tip" text="called by the command handler" />

```ts
abstract next(): string
```

A new unique id. Wrap it in your identifier: `new OrderId(ids.next())`. `IdGenerator` extends
`Port`.

::: warning Caveats
- Ports are declared in `domain/ports/*.port.ts`, of a bounded context or of the shared kernel;
  `alveolus arch check` reports a port declared anywhere else.
- Core ships no implementation of `Clock` or `IdGenerator`: they are adapters of your project.
:::

## Usage

Build `Payments`, what the ordering domain needs to charge an order, then implement it with
Stripe. Each step shows the whole file it changes: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-say-what-the-domain-needs">Say what the domain needs</a></span>In its own words.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-port">Declare the port</a></span>An abstract class in the domain.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-describe-the-operation">Describe the operation</a></span>Domain types in, a Result out.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-implement-it-in-a-driven-adapter">Implement it in a driven adapter</a></span>The provider stays at the edge.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-use-it-from-a-handler">Use it from a handler</a></span>Through the abstraction.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Say what the domain needs

Placing an order charges the customer. The domain says it with its own types: an
[`OrderId`](./value-objects.md#identifier), an amount in [`Money`](./value-objects.md), and a
`PaymentDeclined` [domain error](./domain-errors.md).

### 2. Declare the port

So that the domain depends on what it needs, not on a provider, the need is an abstract class
named in the words of the domain. It is also the token the composition root binds an adapter to.

```ts [src/ordering/domain/ports/payments.port.ts]
import { Port } from "@alveolus/core";

export abstract class Payments extends Port {}
```

### 3. Describe the operation

Each operation takes and returns domain objects. A refusal the domain must handle is a domain
error in a `Result`; a broken connection stays an exception.

```ts [src/ordering/domain/ports/payments.port.ts]
import { Port } from "@alveolus/core"; // [!code --]
import { Port, type Result } from "@alveolus/core"; // [!code ++]

import type { PaymentDeclined } from "../errors/payment-declined.error"; // [!code ++]
import type { Money } from "../value-objects/money.value-object"; // [!code ++]
import type { OrderId } from "../value-objects/order-id.identifier"; // [!code ++]

export abstract class Payments extends Port {} // [!code --]
export abstract class Payments extends Port { // [!code ++]
	abstract charge( // [!code ++]
		orderId: OrderId, // [!code ++]
		amount: Money, // [!code ++]
	): Promise<Result<void, PaymentDeclined>>; // [!code ++]
} // [!code ++]
```

### 4. Implement it in a driven adapter

Stripe stays at the edge: the adapter extends the port, translates the call, and turns a declined
payment into the error of the domain.

```ts [src/ordering/driven/stripe/adapters/stripe-payments.adapter.ts]
import { err, ok, type Result } from "@alveolus/core";
import type Stripe from "stripe";

import {
	PaymentDeclined,
} from "../../../domain/errors/payment-declined.error";
import { Payments } from "../../../domain/ports/payments.port";
import type {
	Money,
} from "../../../domain/value-objects/money.value-object";
import type {
	OrderId,
} from "../../../domain/value-objects/order-id.identifier";

export class StripePayments extends Payments {
	constructor(private readonly stripe: Stripe) {
		super();
	}

	async charge(
		orderId: OrderId,
		amount: Money,
	): Promise<Result<void, PaymentDeclined>> {
		const intent = await this.stripe.paymentIntents.create({
			amount: Math.round(amount.amount * 100),
			currency: amount.currency,
			metadata: { orderId: orderId.value },
		});
		if (intent.status !== "succeeded") {
			return err(new PaymentDeclined({ orderId: orderId.value }));
		}
		return ok();
	}
}
```

### 5. Use it from a handler

The handler asks for `Payments` and never knows which provider answers; the composition root
passes a `StripePayments`.

```ts [src/ordering/application/commands/pay-order.command.ts]
const charged = await this.payments.charge(order.id, total);
if (!charged.ok) {
	return charged;
}
```

### 6. Check it

Run the checks. Three rules keep the port and its adapter the way they are now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-portless-adapter"><code>no-portless-adapter</code></a></span>The adapter extends the port it implements, declared in the domain.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-impure-domain"><code>no-impure-domain</code></a></span>The port imports the domain only: Stripe never reaches it.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span><code>domain/ports/*.port.ts</code> and <code>driven/&lt;technology&gt;/adapters/*.adapter.ts</code>.</div>
</div>

An adapter that forgets its port is reported:

```
src/ordering/driven/stripe/adapters/stripe-payments.adapter.ts:16
  layers/no-portless-adapter: StripePayments is a driven adapter
  but extends no Port: extend the port it implements.
```

## See also

- [Repositories](./repositories.md), the ports for persistence
- [Anti-corruption layers](../strategic/anti-corruption-layers.md), ports that read another context
- [Project layout](../../guide/project-layout.md), where ports and adapters live
- Rules: [`layers/no-portless-adapter`](../../rules/layers/no-portless-adapter.md), [`layers/no-impure-domain`](../../rules/layers/no-impure-domain.md)
- Vaughn Vernon, *Implementing Domain-Driven Design*, chapter 4, "Architecture"
