---
description: "Command handlers in CQRS with TypeScript: run one use case that changes the system by loading an aggregate, calling one of its methods and saving it."
---

# Command handlers

A command handler runs one use case that changes the system: it loads an aggregate, calls one of its
methods and saves it.

<dl class="al-glance">
	<dt>Layer</dt><dd>Application</dd>
	<dt>File</dt><dd><code>application/commands/place-order.command.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>CommandHandler&lt;Input, Output, Error&gt;</code></a></dd>
	<dt>Called by</dt><dd>Driving adapters: controllers, message consumers, scripts</dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/tactical/no-foreign-command-dependency"><code>tactical/no-foreign-command-dependency</code></a>, <a href="/rules/layers/no-outward-import"><code>layers/no-outward-import</code></a></dd>
</dl>

## Why

Placing an order takes more than calling `order.place()`: load the order, get an id and the time,
save it, hand over its events. If the HTTP controller does all that, the message consumer and the
admin script do it again, each a little differently. Sooner or later one of them forgets to save
the events, or checks a business rule the aggregate never sees.

::: tip The fix
A command handler does these steps once, in a plain class that knows no framework. Every entry
point calls it. The handler coordinates and the [aggregate](../domain/aggregates.md) decides, so the
rules stay in one place.
:::

## How it works

A command handler receives a command, the data of one request, and returns a
[`Result`](../utilities/result.md). In between, it follows four steps:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Load</span>Find the aggregate through its <a href="/core/domain/repositories">command repository</a>. When it is missing, return a domain error.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Call</span>Call one business method, with the ids and the date from the <code>IdGenerator</code> and <code>Clock</code> <a href="/core/domain/ports">ports</a>. A failure is returned as is.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Save</span>Store the aggregate through the same repository.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span>Hand over the events</span>Translate the recorded events and add them to the <a href="/core/application/outbox">outbox</a>, in the same <a href="/core/application/unit-of-work">unit of work</a>.</div>
</div>

```ts
async handle({
		orderId,
	}: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
	const order = await this.orders.findById(new OrderId(orderId));
	if (order === undefined) {
		return err(new OrderNotFound({ orderId }));
	}
	const placed = order.place(this.ids.next(), this.clock.now());
	if (!placed.ok) {
		return placed;
	}
	await this.orders.save(order);
	return ok();
}
```

## Where it fits

The command handler sits between the outside world and the domain. A driving adapter builds the
command and calls `handle`; the handler talks to the domain only through repositories, ports and
the aggregate.

<div class="al-diagram">
<svg viewBox="0 0 680 300" role="img" aria-label="A controller calls the PlaceOrderHandler, which in one unit of work loads the Order from the repository, calls order.place, saves the order and adds its events to the outbox.">
	<defs>
		<marker id="command-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="122" width="130" height="56" rx="8" />
	<text class="label" x="73" y="146" text-anchor="middle">Controller</text>
	<text class="note" x="73" y="166" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 150 L 178 150" marker-end="url(#command-flow-arrow)" />
	<rect class="boundary" x="180" y="122" width="180" height="56" rx="8" />
	<text class="label" x="270" y="146" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="270" y="166" text-anchor="middle">this page</text>
	<text class="note" x="270" y="204" text-anchor="middle">one unit of work</text>
	<rect class="box" x="440" y="24" width="232" height="48" rx="8" />
	<text class="label" x="556" y="44" text-anchor="middle">1 · orders.findById(id)</text>
	<text class="note" x="556" y="62" text-anchor="middle">command repository</text>
	<rect class="box" x="440" y="92" width="232" height="48" rx="8" />
	<text class="label" x="556" y="112" text-anchor="middle">2 · order.place(…)</text>
	<text class="note" x="556" y="130" text-anchor="middle">the aggregate decides</text>
	<rect class="box" x="440" y="160" width="232" height="48" rx="8" />
	<text class="label" x="556" y="180" text-anchor="middle">3 · orders.save(order)</text>
	<text class="note" x="556" y="198" text-anchor="middle">command repository</text>
	<rect class="box" x="440" y="228" width="232" height="48" rx="8" />
	<text class="label" x="556" y="248" text-anchor="middle">4 · outbox.add(events)</text>
	<text class="note" x="556" y="266" text-anchor="middle">translated events</text>
	<path class="link" d="M 360 150 L 438 48" marker-end="url(#command-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 116" marker-end="url(#command-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 184" marker-end="url(#command-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 252" marker-end="url(#command-flow-arrow)" />
</svg>
</div>

::: tip
The controller turns HTTP into a command and a `Result` into a response. The handler turns a command
into calls to the domain. Neither holds a business rule.
:::

## API

```ts
import { CommandHandler } from "@alveolus/core";
// or: import { CommandHandler } from "@alveolus/core/command-handlers";
```

### Type parameters

```ts
abstract class CommandHandler<
	Input,
	Output = void,
	Error extends AnyDomainError = never,
> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Input` | The command: the data the handler needs. | any type |
| `Output` | What a success returns, such as the id of what was created. | `void` by default |
| `Error` | The union of the [domain errors](../domain/domain-errors.md) it may return. | extends `DomainError`; `never` by default |

### `constructor(…)` <Badge type="tip" text="you implement it" />

```ts
constructor(
	private readonly orders: Orders,
	private readonly clock: Clock,
	private readonly ids: IdGenerator,
) {
	super();
}
```

`CommandHandler` declares no constructor: yours takes the dependencies as abstract classes, such
as repositories, ports, the unit of work and the outbox, and calls `super()`.

### `handle(command)` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" /> <Badge type="tip" text="called by a driving adapter" />

```ts
abstract handle(command: Input): Promise<Result<Output, Error>>
```

Runs the use case and returns its outcome. The driving adapter that calls it turns the `Result`
into a response.

::: warning Caveats
- `Error` only accepts `DomainError` subclasses. A technical failure, such as a lost database
  connection, is thrown and handled like any other exception.
- Alveolus provides no bus and no container: wire handlers in the composition root, by hand or
  with the container of your framework. See [Integrations](../../integrations/index.md).
- The events recorded by the aggregate stay on it after `save`: hand them over through the
  [outbox](./outbox.md).
:::

## Usage

Build the handler that places an order, one responsibility at a time. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-declare-the-command">Declare the command</a></span>Say what the caller provides and what can fail.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-handler">Declare the handler</a></span>One class, one use case.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-call-the-aggregate">Call the aggregate</a></span>Let the aggregate decide.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-save-it">Save it</a></span>Store the changed aggregate.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-hand-over-its-events">Hand over its events</a></span>Translate and add them to the outbox.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-make-it-atomic">Make it atomic</a></span>One transaction for the change and its events.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">7</span><a href="#_7-call-it-from-a-driving-adapter">Call it from a driving adapter</a></span>Turn the Result into a response.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">8</span><a href="#_8-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Declare the command

So that a driving adapter knows what to provide and what to handle, the command is a plain type named in the imperative, next to the union of every failure it can return.

```ts [src/ordering/application/commands/place-order.command.ts]
import type { EmptyOrder } from "../../domain/errors/empty-order.error";
import type {
	OrderAlreadyPlaced,
} from "../../domain/errors/order-already-placed.error";
import { OrderNotFound } from "../../domain/errors/order-not-found.error";

export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError =
	| OrderNotFound
	| OrderAlreadyPlaced
	| EmptyOrder;
```

### 2. Declare the handler

The handler extends `CommandHandler` with the command, its output and its errors. It receives its dependencies as abstract classes, so that any framework can build it, and loads the aggregate through its repository. A missing order is a failure it declares, not an exception.

```ts [src/ordering/application/commands/place-order.command.ts]
import { CommandHandler, err, ok, type Result } from "@alveolus/core"; // [!code ++]

import type { EmptyOrder } from "../../domain/errors/empty-order.error";
import type {
	OrderAlreadyPlaced,
} from "../../domain/errors/order-already-placed.error";
import { OrderNotFound } from "../../domain/errors/order-not-found.error";
import { Orders } from "../../domain/repositories/orders.repository"; // [!code ++]
import { OrderId } from "../../domain/value-objects/order-id.identifier"; // [!code ++]

export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError =
	| OrderNotFound
	| OrderAlreadyPlaced
	| EmptyOrder;

export class PlaceOrderHandler extends CommandHandler< // [!code ++]
	PlaceOrder, // [!code ++]
	void, // [!code ++]
	PlaceOrderError // [!code ++]
> { // [!code ++]
	constructor( // [!code ++]
		private readonly orders: Orders, // [!code ++]
	) { // [!code ++]
		super(); // [!code ++]
	} // [!code ++]

	async handle({ // [!code ++]
		orderId, // [!code ++]
	}: PlaceOrder): Promise<Result<void, PlaceOrderError>> { // [!code ++]
		const order = await this.orders.findById( // [!code ++]
			new OrderId(orderId), // [!code ++]
		); // [!code ++]
		if (order === undefined) { // [!code ++]
			return err(new OrderNotFound({ orderId })); // [!code ++]
		} // [!code ++]
		return ok(); // [!code ++]
	} // [!code ++]
} // [!code ++]
```

### 3. Call the aggregate

The handler decides nothing: it calls one business method and returns its failure as is. The event id and the date come from the `Clock` and `IdGenerator` [ports](../domain/ports.md), so the aggregate never reads them itself.

```ts [src/ordering/application/commands/place-order.command.ts]
import { CommandHandler, err, ok, type Result } from "@alveolus/core"; // [!code --]
import { // [!code ++]
	Clock, // [!code ++]
	CommandHandler, // [!code ++]
	err, // [!code ++]
	IdGenerator, // [!code ++]
	ok, // [!code ++]
	type Result, // [!code ++]
} from "@alveolus/core"; // [!code ++]

import type { EmptyOrder } from "../../domain/errors/empty-order.error";
import type {
	OrderAlreadyPlaced,
} from "../../domain/errors/order-already-placed.error";
import { OrderNotFound } from "../../domain/errors/order-not-found.error";
import { Orders } from "../../domain/repositories/orders.repository";
import { OrderId } from "../../domain/value-objects/order-id.identifier";

export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError =
	| OrderNotFound
	| OrderAlreadyPlaced
	| EmptyOrder;

export class PlaceOrderHandler extends CommandHandler<
	PlaceOrder,
	void,
	PlaceOrderError
> {
	constructor(
		private readonly orders: Orders,
		private readonly clock: Clock, // [!code ++]
		private readonly ids: IdGenerator, // [!code ++]
	) {
		super();
	}

	async handle({
		orderId,
	}: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById(
			new OrderId(orderId),
		);
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place( // [!code ++]
			this.ids.next(), // [!code ++]
			this.clock.now(), // [!code ++]
		); // [!code ++]
		if (!placed.ok) { // [!code ++]
			return placed; // [!code ++]
		} // [!code ++]
		return ok();
	}
}
```

### 4. Save it

Only a successful change is saved: when `place` fails, the handler has already returned and the order stays as it was in storage.

```ts [src/ordering/application/commands/place-order.command.ts]
import {
	Clock,
	CommandHandler,
	err,
	IdGenerator,
	ok,
	type Result,
} from "@alveolus/core";

import type { EmptyOrder } from "../../domain/errors/empty-order.error";
import type {
	OrderAlreadyPlaced,
} from "../../domain/errors/order-already-placed.error";
import { OrderNotFound } from "../../domain/errors/order-not-found.error";
import { Orders } from "../../domain/repositories/orders.repository";
import { OrderId } from "../../domain/value-objects/order-id.identifier";

export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError =
	| OrderNotFound
	| OrderAlreadyPlaced
	| EmptyOrder;

export class PlaceOrderHandler extends CommandHandler<
	PlaceOrder,
	void,
	PlaceOrderError
> {
	constructor(
		private readonly orders: Orders,
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {
		super();
	}

	async handle({
		orderId,
	}: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById(
			new OrderId(orderId),
		);
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place(
			this.ids.next(),
			this.clock.now(),
		);
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order); // [!code ++]
		return ok();
	}
}
```

### 5. Hand over its events

Other contexts must learn that the order was placed. After saving, the handler pulls the recorded events, translates each one into the published language and adds them to the [outbox](./outbox.md).

```ts [src/ordering/application/commands/place-order.command.ts]
import {
	Clock,
	CommandHandler,
	err,
	IdGenerator,
	ok,
	Outbox, // [!code ++]
	type Result,
} from "@alveolus/core";

import type { EmptyOrder } from "../../domain/errors/empty-order.error";
import type {
	OrderAlreadyPlaced,
} from "../../domain/errors/order-already-placed.error";
import { OrderNotFound } from "../../domain/errors/order-not-found.error";
import { Orders } from "../../domain/repositories/orders.repository";
import { OrderId } from "../../domain/value-objects/order-id.identifier";
import { // [!code ++]
	OrderEventsTranslator, // [!code ++]
} from "../translators/order-events.translator"; // [!code ++]

export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError =
	| OrderNotFound
	| OrderAlreadyPlaced
	| EmptyOrder;

export class PlaceOrderHandler extends CommandHandler<
	PlaceOrder,
	void,
	PlaceOrderError
> {
	constructor(
		private readonly orders: Orders,
		private readonly outbox: Outbox, // [!code ++]
		private readonly translator: OrderEventsTranslator, // [!code ++]
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {
		super();
	}

	async handle({
		orderId,
	}: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById(
			new OrderId(orderId),
		);
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place(
			this.ids.next(),
			this.clock.now(),
		);
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order);
		const events = order // [!code ++]
			.pullDomainEvents() // [!code ++]
			.map((event) => // [!code ++]
				this.translator.translate(event, { // [!code ++]
					correlationId: orderId, // [!code ++]
				}), // [!code ++]
			); // [!code ++]
		await this.outbox.add(events); // [!code ++]
		return ok();
	}
}
```

### 6. Make it atomic

If saving the order succeeds and adding its events fails, the rest of the system never hears of it. The [unit of work](./unit-of-work.md) runs both in one transaction, and rolls back when the work returns a failure.

```ts [src/ordering/application/commands/place-order.command.ts]
import {
	Clock,
	CommandHandler,
	err,
	IdGenerator,
	ok,
	Outbox,
	type Result,
	UnitOfWork, // [!code ++]
} from "@alveolus/core";

import type { EmptyOrder } from "../../domain/errors/empty-order.error";
import type {
	OrderAlreadyPlaced,
} from "../../domain/errors/order-already-placed.error";
import { OrderNotFound } from "../../domain/errors/order-not-found.error";
import { Orders } from "../../domain/repositories/orders.repository";
import { OrderId } from "../../domain/value-objects/order-id.identifier";
import {
	OrderEventsTranslator,
} from "../translators/order-events.translator";

export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError =
	| OrderNotFound
	| OrderAlreadyPlaced
	| EmptyOrder;

export class PlaceOrderHandler extends CommandHandler<
	PlaceOrder,
	void,
	PlaceOrderError
> {
	constructor(
		private readonly orders: Orders,
		private readonly unitOfWork: UnitOfWork, // [!code ++]
		private readonly outbox: Outbox,
		private readonly translator: OrderEventsTranslator,
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {
		super();
	}

	async handle({
		orderId,
	}: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById( // [!code --]
			new OrderId(orderId), // [!code --]
		); // [!code --]
		if (order === undefined) { // [!code --]
			return err(new OrderNotFound({ orderId })); // [!code --]
		} // [!code --]
		const placed = order.place( // [!code --]
			this.ids.next(), // [!code --]
			this.clock.now(), // [!code --]
		); // [!code --]
		if (!placed.ok) { // [!code --]
			return placed; // [!code --]
		} // [!code --]
		await this.orders.save(order); // [!code --]
		const events = order // [!code --]
			.pullDomainEvents() // [!code --]
			.map((event) => // [!code --]
				this.translator.translate(event, { // [!code --]
					correlationId: orderId, // [!code --]
				}), // [!code --]
		return this.unitOfWork.run(async () => { // [!code ++]
			const order = await this.orders.findById( // [!code ++]
				new OrderId(orderId), // [!code ++]
			);
		await this.outbox.add(events); // [!code --]
		return ok(); // [!code --]
			if (order === undefined) { // [!code ++]
				return err(new OrderNotFound({ orderId })); // [!code ++]
			} // [!code ++]
			const placed = order.place( // [!code ++]
				this.ids.next(), // [!code ++]
				this.clock.now(), // [!code ++]
			); // [!code ++]
			if (!placed.ok) { // [!code ++]
				return placed; // [!code ++]
			} // [!code ++]
			await this.orders.save(order); // [!code ++]
			const events = order // [!code ++]
				.pullDomainEvents() // [!code ++]
				.map((event) => // [!code ++]
					this.translator.translate(event, { // [!code ++]
						correlationId: orderId, // [!code ++]
					}), // [!code ++]
				); // [!code ++]
			await this.outbox.add(events); // [!code ++]
			return ok(); // [!code ++]
		}); // [!code ++]
	}
}
```

This is the complete handler.

### 7. Call it from a driving adapter

So that HTTP stays out of the application, a controller builds the command, calls `handle` and turns the `Result` into a response. Domain errors become HTTP errors there, and nowhere else.

```ts [src/ordering/driving/http/controllers/orders.controller.ts]
const placed = await this.placeOrder.handle({ orderId });
if (!placed.ok) {
	return {
		status: 422,
		body: {
			error: placed.error.type,
			details: placed.error.payload,
		},
	};
}
return { status: 204 };
```

### 8. Check it

Run the checks. Three rules keep the handler the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-foreign-command-dependency"><code>no-foreign-command-dependency</code></a></span>It receives command repositories, ports, event translators, domain services and value objects: never a query repository or another handler.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>application/commands/*.command.ts</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-outward-import"><code>no-outward-import</code></a></span>It imports the domain and the application, never an adapter.</div>
</div>

A query repository added to its constructor is reported:

```
src/ordering/application/commands/place-order.command.ts
  46  tactical/no-foreign-command-dependency: The CommandHandler
  PlaceOrderHandler receives OrderSummaries, a QueryRepository: a
  command handler receives command repositories, ports, event
  translators, domain services and value objects.
```

## See also

- [Aggregates](../domain/aggregates.md), which hold the rules the handler calls
- [Repositories](../domain/repositories.md), to load and save aggregates
- [Unit of Work](./unit-of-work.md) and [Outbox](./outbox.md), to change and record atomically
- [Query handlers](./query-handlers.md), for requests that only read
- Rules: [`tactical/no-foreign-command-dependency`](../../rules/tactical/no-foreign-command-dependency.md), [`layers/no-outward-import`](../../rules/layers/no-outward-import.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
