---
description: "Aggregates in Domain-Driven Design with TypeScript: a group of objects changed together through one aggregate root that keeps their invariants."
---

# Aggregates

An aggregate is a group of objects changed together through one entry point, the root, which keeps
their rules.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain</dd>
	<dt>File</dt><dd><code>domain/aggregates/order.aggregate.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>AggregateRoot&lt;Id, Event, Snapshot&gt;</code></a></dd>
	<dt>Called by</dt><dd><a href="/core/application/command-handlers">Command handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/tactical/no-thrown-failure"><code>tactical/no-thrown-failure</code></a>, <a href="/rules/tactical/no-aggregate-reference"><code>tactical/no-aggregate-reference</code></a>, <a href="/rules/tactical/no-public-field"><code>tactical/no-public-field</code></a></dd>
</dl>

## Why

An order must not be placed empty, and once placed, its lines must not change. If any code can add
a line or flip the status, sooner or later one of them forgets a rule, and nothing tells you.

::: tip The fix
An aggregate puts the order and its lines behind one door: the root, `Order`. Every change goes
through one of its methods, which checks the rules, applies the change and records what happened.
It is loaded, changed and saved as a whole.
:::

## How it works

The aggregate is a boundary drawn around the objects that share rules. Inside, one object is the
root: the only one code outside may hold and call. The others, such as the
[entities](./entities.md) `OrderLine`, are reached through it. Another aggregate, such as
`Customer`, stays outside: the order keeps only its identifier.

<div class="al-diagram">
<svg viewBox="0 0 680 250" role="img" aria-label="The Order aggregate: the root Order holds its order lines. It refers to the Customer aggregate only through a CustomerId.">
	<defs>
		<marker id="aggregate-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="8" width="392" height="234" rx="14" />
	<text class="note" x="24" y="32">Order aggregate · one transaction</text>
	<rect class="box" x="124" y="52" width="160" height="56" rx="8" />
	<text class="label" x="204" y="76" text-anchor="middle">Order</text>
	<text class="note" x="204" y="96" text-anchor="middle">root · the only door</text>
	<rect class="box" x="30" y="166" width="160" height="56" rx="8" />
	<text class="label" x="110" y="190" text-anchor="middle">OrderLine</text>
	<text class="note" x="110" y="210" text-anchor="middle">Entity</text>
	<rect class="box" x="218" y="166" width="160" height="56" rx="8" />
	<text class="label" x="298" y="190" text-anchor="middle">OrderLine</text>
	<text class="note" x="298" y="210" text-anchor="middle">Entity</text>
	<path class="link" d="M 176 108 L 122 164" marker-end="url(#aggregate-arrow)" />
	<path class="link" d="M 232 108 L 286 164" marker-end="url(#aggregate-arrow)" />
	<rect class="box" x="506" y="52" width="160" height="56" rx="8" />
	<text class="label" x="586" y="76" text-anchor="middle">Customer</text>
	<text class="note" x="586" y="96" text-anchor="middle">another aggregate</text>
	<path class="link" d="M 284 80 L 504 80" stroke-dasharray="4 4" marker-end="url(#aggregate-arrow)" />
	<text class="note" x="453" y="70" text-anchor="middle">CustomerId</text>
</svg>
</div>

A business method of the root does three things, in this order:

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Check the rules</span>If one is broken, return a <a href="./domain-errors">domain error</a> in a <a href="../utilities/result"><code>Result</code></a>. Nothing changes.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Change the state</span>Fields are private: only the aggregate writes them.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Record an event</span>A <a href="./domain-events">domain event</a> says what happened, for the rest of the system.</div>
</div>

```ts
place(
	eventId: string,
	now: Date,
): Result<void, OrderAlreadyPlaced | EmptyOrder> {
	if (this.status === "placed") {
		return err(new OrderAlreadyPlaced());
	}
	if (this.lines.length === 0) {
		return err(new EmptyOrder());
	}
	this.status = "placed";
	this.record(
		new OrderPlaced({
			id: eventId,
			aggregateId: this.id,
			occurredAt: now,
			payload: { customerId: this.customerId.value },
		}),
	);
	return ok();
}
```

## Where it fits

The aggregate never runs alone. A [command handler](../application/command-handlers.md) loads it
through a [repository](./repositories.md), calls one business method, saves it, and hands its events
to the [outbox](../application/outbox.md), all in one [unit of work](../application/unit-of-work.md).

<div class="al-diagram">
<svg viewBox="0 0 680 300" role="img" aria-label="A request goes from a controller to the PlaceOrderHandler, which in one unit of work loads the Order from the repository, calls order.place, saves the order and adds its events to the outbox.">
	<defs>
		<marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="122" width="130" height="56" rx="8" />
	<text class="label" x="73" y="146" text-anchor="middle">Controller</text>
	<text class="note" x="73" y="166" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 150 L 178 150" marker-end="url(#flow-arrow)" />
	<rect class="box" x="180" y="122" width="180" height="56" rx="8" />
	<text class="label" x="270" y="146" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="270" y="166" text-anchor="middle">command handler</text>
	<text class="note" x="270" y="204" text-anchor="middle">one unit of work</text>
	<rect class="box" x="440" y="24" width="232" height="48" rx="8" />
	<text class="label" x="556" y="44" text-anchor="middle">1 · orders.findById(id)</text>
	<text class="note" x="556" y="62" text-anchor="middle">loads the Order</text>
	<rect class="boundary" x="440" y="92" width="232" height="48" rx="8" />
	<text class="label" x="556" y="112" text-anchor="middle">2 · order.place(…)</text>
	<text class="note" x="556" y="130" text-anchor="middle">this page: rules + event</text>
	<rect class="box" x="440" y="160" width="232" height="48" rx="8" />
	<text class="label" x="556" y="180" text-anchor="middle">3 · orders.save(order)</text>
	<text class="note" x="556" y="198" text-anchor="middle">stores its snapshot</text>
	<rect class="box" x="440" y="228" width="232" height="48" rx="8" />
	<text class="label" x="556" y="248" text-anchor="middle">4 · outbox.add(events)</text>
	<text class="note" x="556" y="266" text-anchor="middle">hands over its events</text>
	<path class="link" d="M 360 150 L 438 48" marker-end="url(#flow-arrow)" />
	<path class="link" d="M 360 150 L 438 116" marker-end="url(#flow-arrow)" />
	<path class="link" d="M 360 150 L 438 184" marker-end="url(#flow-arrow)" />
	<path class="link" d="M 360 150 L 438 252" marker-end="url(#flow-arrow)" />
</svg>
</div>

::: tip
The handler decides nothing: it coordinates. Every business rule lives in the aggregate, so the same
rule holds whichever handler, test or script calls it.
:::

## API

```ts
import { AggregateRoot } from "@alveolus/core";
// or: import { AggregateRoot } from "@alveolus/core/aggregates";
```

### Type parameters

```ts
abstract class AggregateRoot<
	Id extends AnyIdentifier,
	Event extends AnyDomainEvent = AnyDomainEvent,
	Snapshot extends AnySnapshot = AnySnapshot,
> extends Entity<Id, Snapshot> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Id` | The [identifier](./value-objects.md#identifier) of the aggregate. | extends `Identifier` |
| `Event` | The domain events it records: one class, or a union such as `OrderPlaced \| OrderCancelled`. | extends `DomainEvent`; any event by default |
| `Snapshot` | The plain data its state is saved as. | a `type` of plain data; any by default |

`AnyAggregateRoot` is the type of any aggregate, for code that accepts all of them.

### `constructor(id)` <Badge type="info" text="protected" /> <Badge type="tip" text="you call it" />

```ts
protected constructor(id: Id)
```

Stores the identifier. Declare your own constructor `private` and call `super(id)` from it: only
your factories and `fromSnapshot` create the aggregate.

### `toSnapshot()` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" />

```ts
abstract toSnapshot(): Snapshot
```

Returns the state as plain data, for the repository. Each entity inside is written as its own
snapshot, each value object as its raw value.

### `fromSnapshot(snapshot)` <Badge type="info" text="static · convention" /> <Badge type="tip" text="you implement it" />

```ts
static fromSnapshot(snapshot: OrderSnapshot): Order
```

Rebuilds the aggregate from its snapshot, through the private constructor. It checks no rule and
records no event. Not declared by `AggregateRoot`: TypeScript has no abstract static methods.

### `record(event)` <Badge type="info" text="protected" /> <Badge type="tip" text="inside your methods" />

```ts
protected record(event: Event): void
```

Records a domain event, to be pulled after the aggregate is saved. Only the aggregate records its
events.

### `pullDomainEvents()` <Badge type="tip" text="called by the command handler" />

```ts
pullDomainEvents(): Event[]
```

Returns the recorded events, in order, and clears them. Call it after saving, then add the events
to the outbox.

### `domainEvents` <Badge type="info" text="getter" /> <Badge type="tip" text="read by tests" />

```ts
get domainEvents(): readonly Event[]
```

Returns a copy of the recorded events, without clearing them.

### `equals(other)` <Badge type="tip" text="called by anyone" />

```ts
equals(other: AnyEntity): boolean
```

`true` when `other` is the same object, or an instance of the same class with an equal
identifier.

### `id` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by anyone" />

```ts
readonly id: Id
```

The identifier given to the constructor.

::: warning Caveats
- TypeScript has no abstract static methods: the compiler does not check that `fromSnapshot`
  exists.
- Declare the snapshot with `type`, not `interface`: an interface does not satisfy `AnySnapshot`.
- No version is kept: to prevent lost updates, put a `version` in your snapshot and check it in the
  repository adapter.
:::

## Usage

Build the `Order` aggregate of the running example, one rule at a time. Each step shows the whole
file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-name-it">Name it</a></span>Give the aggregate its identifier.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-root">Declare the root</a></span>One class, one way in.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-make-it-storable">Make it storable</a></span>Save and restore its state.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-change-it-through-a-method">Change it through a method</a></span>No setter, a business method.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-guard-a-rule">Guard a rule</a></span>Refuse what breaks the rules.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-record-what-happened">Record what happened</a></span>A domain event for the rest of the system.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">7</span><a href="#_7-expose-reads-as-getters">Expose reads as getters</a></span>Let callers read without changing.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">8</span><a href="#_8-call-it-from-a-handler">Call it from a handler</a></span>Load, change, save, hand over.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">9</span><a href="#_9-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Name it

An aggregate is known by its identifier: declare `OrderId` as an
[identifier](./value-objects.md#identifier), in `domain/value-objects/order-id.identifier.ts`.

### 2. Declare the root

So that nothing creates an order in a wrong state, the constructor is private and a static factory
is the only way in. The order keeps its customer as a `CustomerId`, never as a `Customer`.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot } from "@alveolus/core";

import { CustomerId } from "../value-objects/customer-id.identifier";
import { OrderId } from "../value-objects/order-id.identifier";

type OrderStatus = "draft" | "placed";

export class Order extends AggregateRoot<OrderId> {
	private constructor(
		id: OrderId,
		private readonly customerId: CustomerId,
		private status: OrderStatus,
	) {
		super(id);
	}

	static create(id: OrderId, customerId: CustomerId): Order {
		return new Order(id, customerId, "draft");
	}
}
```

`id` is not a field of `Order`: it is passed to `super`, which stores it as the public, read-only
identifier. TypeScript now asks for `toSnapshot()`: the next step adds it.

### 3. Make it storable

The state is private, so the repository cannot read the fields: it saves a snapshot, plain data
declared with `type`. `fromSnapshot` rebuilds the order without checking rules or recording
events. The order records no event yet, hence `never`.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot } from "@alveolus/core";

import { CustomerId } from "../value-objects/customer-id.identifier";
import { OrderId } from "../value-objects/order-id.identifier";

type OrderStatus = "draft" | "placed";

export type OrderSnapshot = { // [!code ++]
	readonly id: string; // [!code ++]
	readonly customerId: string; // [!code ++]
	readonly status: OrderStatus; // [!code ++]
}; // [!code ++]

export class Order extends AggregateRoot<OrderId> { // [!code --]
export class Order extends AggregateRoot< // [!code ++]
	OrderId, // [!code ++]
	never, // [!code ++]
	OrderSnapshot // [!code ++]
> { // [!code ++]
	private constructor(
		id: OrderId,
		private readonly customerId: CustomerId,
		private status: OrderStatus,
	) {
		super(id);
	}

	static create(id: OrderId, customerId: CustomerId): Order {
		return new Order(id, customerId, "draft");
	}

	static fromSnapshot(snapshot: OrderSnapshot): Order { // [!code ++]
		return new Order( // [!code ++]
			new OrderId(snapshot.id), // [!code ++]
			new CustomerId(snapshot.customerId), // [!code ++]
			snapshot.status, // [!code ++]
		); // [!code ++]
	} // [!code ++]

	toSnapshot(): OrderSnapshot { // [!code ++]
		return { // [!code ++]
			id: this.id.value, // [!code ++]
			customerId: this.customerId.value, // [!code ++]
			status: this.status, // [!code ++]
		}; // [!code ++]
	} // [!code ++]
}
```

### 4. Change it through a method

So that no caller can skip a rule, the order has no setter: it changes through a method named
after what the business does. A failure is returned in a `Result`, never thrown, so the caller
sees it in the signature.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot } from "@alveolus/core"; // [!code --]
import { AggregateRoot, err, ok, type Result } from "@alveolus/core"; // [!code ++]

import { // [!code ++]
	OrderLine, // [!code ++]
	type OrderLineSnapshot, // [!code ++]
} from "../entities/order-line.entity"; // [!code ++]
import { // [!code ++]
	OrderAlreadyPlaced, // [!code ++]
} from "../errors/order-already-placed.error"; // [!code ++]
import { CustomerId } from "../value-objects/customer-id.identifier";
import { OrderId } from "../value-objects/order-id.identifier";
import { OrderLineId } from "../value-objects/order-line-id.identifier"; // [!code ++]
import { ProductId } from "../value-objects/product-id.identifier"; // [!code ++]

type OrderStatus = "draft" | "placed";

export type OrderSnapshot = {
	readonly id: string;
	readonly customerId: string;
	readonly status: OrderStatus;
	readonly lines: readonly OrderLineSnapshot[]; // [!code ++]
};

export class Order extends AggregateRoot<
	OrderId,
	never,
	OrderSnapshot
> {
	private constructor(
		id: OrderId,
		private readonly customerId: CustomerId,
		private status: OrderStatus,
		private readonly lines: OrderLine[], // [!code ++]
	) {
		super(id);
	}

	static create(id: OrderId, customerId: CustomerId): Order {
		return new Order(id, customerId, "draft"); // [!code --]
		return new Order(id, customerId, "draft", []); // [!code ++]
	}

	static fromSnapshot(snapshot: OrderSnapshot): Order {
		return new Order(
			new OrderId(snapshot.id),
			new CustomerId(snapshot.customerId),
			snapshot.status,
			snapshot.lines.map((line) => // [!code ++]
				OrderLine.fromSnapshot(line), // [!code ++]
			), // [!code ++]
		);
	}

	addLine( // [!code ++]
		lineId: OrderLineId, // [!code ++]
		productId: ProductId, // [!code ++]
	): Result<void, OrderAlreadyPlaced> { // [!code ++]
		if (this.status === "placed") { // [!code ++]
			return err(new OrderAlreadyPlaced()); // [!code ++]
		} // [!code ++]
		this.lines.push(OrderLine.create(lineId, productId)); // [!code ++]
		return ok(); // [!code ++]
	} // [!code ++]

	toSnapshot(): OrderSnapshot {
		return {
			id: this.id.value,
			customerId: this.customerId.value,
			status: this.status,
			lines: this.lines.map((line) => line.toSnapshot()), // [!code ++]
		};
	}
}
```

`OrderLine` is an [entity](./entities.md) inside the aggregate: only the order creates and
changes it.

### 5. Guard a rule

An order cannot be placed empty, nor twice. The rule lives in `place`, so it holds whichever
handler, test or script calls it. Nothing changes when a rule is broken.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot, err, ok, type Result } from "@alveolus/core";

import {
	OrderLine,
	type OrderLineSnapshot,
} from "../entities/order-line.entity";
import { EmptyOrder } from "../errors/empty-order.error"; // [!code ++]
import {
	OrderAlreadyPlaced,
} from "../errors/order-already-placed.error";
import { CustomerId } from "../value-objects/customer-id.identifier";
import { OrderId } from "../value-objects/order-id.identifier";
import { OrderLineId } from "../value-objects/order-line-id.identifier";
import { ProductId } from "../value-objects/product-id.identifier";

type OrderStatus = "draft" | "placed";

export type OrderSnapshot = {
	readonly id: string;
	readonly customerId: string;
	readonly status: OrderStatus;
	readonly lines: readonly OrderLineSnapshot[];
};

export class Order extends AggregateRoot<
	OrderId,
	never,
	OrderSnapshot
> {
	private constructor(
		id: OrderId,
		private readonly customerId: CustomerId,
		private status: OrderStatus,
		private readonly lines: OrderLine[],
	) {
		super(id);
	}

	static create(id: OrderId, customerId: CustomerId): Order {
		return new Order(id, customerId, "draft", []);
	}

	static fromSnapshot(snapshot: OrderSnapshot): Order {
		return new Order(
			new OrderId(snapshot.id),
			new CustomerId(snapshot.customerId),
			snapshot.status,
			snapshot.lines.map((line) =>
				OrderLine.fromSnapshot(line),
			),
		);
	}

	addLine(
		lineId: OrderLineId,
		productId: ProductId,
	): Result<void, OrderAlreadyPlaced> {
		if (this.status === "placed") {
			return err(new OrderAlreadyPlaced());
		}
		this.lines.push(OrderLine.create(lineId, productId));
		return ok();
	}

	place(): Result<void, OrderAlreadyPlaced | EmptyOrder> { // [!code ++]
		if (this.status === "placed") { // [!code ++]
			return err(new OrderAlreadyPlaced()); // [!code ++]
		} // [!code ++]
		if (this.lines.length === 0) { // [!code ++]
			return err(new EmptyOrder()); // [!code ++]
		} // [!code ++]
		this.status = "placed"; // [!code ++]
		return ok(); // [!code ++]
	} // [!code ++]

	toSnapshot(): OrderSnapshot {
		return {
			id: this.id.value,
			customerId: this.customerId.value,
			status: this.status,
			lines: this.lines.map((line) => line.toSnapshot()),
		};
	}
}
```

### 6. Record what happened

The rest of the system must learn that an order was placed. The order records an `OrderPlaced`
[domain event](./domain-events.md) but never publishes it. So that the same call always gives the
same result, the event id and the date are passed in, never read from a clock or generated.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot, err, ok, type Result } from "@alveolus/core";

import {
	OrderLine,
	type OrderLineSnapshot,
} from "../entities/order-line.entity";
import { EmptyOrder } from "../errors/empty-order.error";
import {
	OrderAlreadyPlaced,
} from "../errors/order-already-placed.error";
import { OrderPlaced } from "../events/order-placed.event"; // [!code ++]
import { CustomerId } from "../value-objects/customer-id.identifier";
import { OrderId } from "../value-objects/order-id.identifier";
import { OrderLineId } from "../value-objects/order-line-id.identifier";
import { ProductId } from "../value-objects/product-id.identifier";

type OrderStatus = "draft" | "placed";

export type OrderSnapshot = {
	readonly id: string;
	readonly customerId: string;
	readonly status: OrderStatus;
	readonly lines: readonly OrderLineSnapshot[];
};

export class Order extends AggregateRoot<
	OrderId,
	never, // [!code --]
	OrderPlaced, // [!code ++]
	OrderSnapshot
> {
	private constructor(
		id: OrderId,
		private readonly customerId: CustomerId,
		private status: OrderStatus,
		private readonly lines: OrderLine[],
	) {
		super(id);
	}

	static create(id: OrderId, customerId: CustomerId): Order {
		return new Order(id, customerId, "draft", []);
	}

	static fromSnapshot(snapshot: OrderSnapshot): Order {
		return new Order(
			new OrderId(snapshot.id),
			new CustomerId(snapshot.customerId),
			snapshot.status,
			snapshot.lines.map((line) =>
				OrderLine.fromSnapshot(line),
			),
		);
	}

	addLine(
		lineId: OrderLineId,
		productId: ProductId,
	): Result<void, OrderAlreadyPlaced> {
		if (this.status === "placed") {
			return err(new OrderAlreadyPlaced());
		}
		this.lines.push(OrderLine.create(lineId, productId));
		return ok();
	}

	place(): Result<void, OrderAlreadyPlaced | EmptyOrder> { // [!code --]
	place( // [!code ++]
		eventId: string, // [!code ++]
		now: Date, // [!code ++]
	): Result<void, OrderAlreadyPlaced | EmptyOrder> { // [!code ++]
		if (this.status === "placed") {
			return err(new OrderAlreadyPlaced());
		}
		if (this.lines.length === 0) {
			return err(new EmptyOrder());
		}
		this.status = "placed";
		this.record( // [!code ++]
			new OrderPlaced({ // [!code ++]
				id: eventId, // [!code ++]
				aggregateId: this.id, // [!code ++]
				occurredAt: now, // [!code ++]
				payload: { customerId: this.customerId.value }, // [!code ++]
			}), // [!code ++]
		); // [!code ++]
		return ok();
	}

	toSnapshot(): OrderSnapshot {
		return {
			id: this.id.value,
			customerId: this.customerId.value,
			status: this.status,
			lines: this.lines.map((line) => line.toSnapshot()),
		};
	}
}
```

### 7. Expose reads as getters

Callers need to read the state without changing it. Reads are getters: a public method must
return a `Result`, a getter does not. The methods use them too.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot, err, ok, type Result } from "@alveolus/core";

import {
	OrderLine,
	type OrderLineSnapshot,
} from "../entities/order-line.entity";
import { EmptyOrder } from "../errors/empty-order.error";
import {
	OrderAlreadyPlaced,
} from "../errors/order-already-placed.error";
import { OrderPlaced } from "../events/order-placed.event";
import { CustomerId } from "../value-objects/customer-id.identifier";
import { OrderId } from "../value-objects/order-id.identifier";
import { OrderLineId } from "../value-objects/order-line-id.identifier";
import { ProductId } from "../value-objects/product-id.identifier";

type OrderStatus = "draft" | "placed";

export type OrderSnapshot = {
	readonly id: string;
	readonly customerId: string;
	readonly status: OrderStatus;
	readonly lines: readonly OrderLineSnapshot[];
};

export class Order extends AggregateRoot<
	OrderId,
	OrderPlaced,
	OrderSnapshot
> {
	private constructor(
		id: OrderId,
		private readonly customerId: CustomerId,
		private status: OrderStatus,
		private readonly lines: OrderLine[],
	) {
		super(id);
	}

	static create(id: OrderId, customerId: CustomerId): Order {
		return new Order(id, customerId, "draft", []);
	}

	get isPlaced(): boolean { // [!code ++]
		return this.status === "placed"; // [!code ++]
	} // [!code ++]

	get lineCount(): number { // [!code ++]
		return this.lines.length; // [!code ++]
	} // [!code ++]

	static fromSnapshot(snapshot: OrderSnapshot): Order {
		return new Order(
			new OrderId(snapshot.id),
			new CustomerId(snapshot.customerId),
			snapshot.status,
			snapshot.lines.map((line) =>
				OrderLine.fromSnapshot(line),
			),
		);
	}

	addLine(
		lineId: OrderLineId,
		productId: ProductId,
	): Result<void, OrderAlreadyPlaced> {
		if (this.status === "placed") { // [!code --]
		if (this.isPlaced) { // [!code ++]
			return err(new OrderAlreadyPlaced());
		}
		this.lines.push(OrderLine.create(lineId, productId));
		return ok();
	}

	place(
		eventId: string,
		now: Date,
	): Result<void, OrderAlreadyPlaced | EmptyOrder> {
		if (this.status === "placed") { // [!code --]
		if (this.isPlaced) { // [!code ++]
			return err(new OrderAlreadyPlaced());
		}
		if (this.lines.length === 0) {
			return err(new EmptyOrder());
		}
		this.status = "placed";
		this.record(
			new OrderPlaced({
				id: eventId,
				aggregateId: this.id,
				occurredAt: now,
				payload: { customerId: this.customerId.value },
			}),
		);
		return ok();
	}

	toSnapshot(): OrderSnapshot {
		return {
			id: this.id.value,
			customerId: this.customerId.value,
			status: this.status,
			lines: this.lines.map((line) => line.toSnapshot()),
		};
	}
}
```

### 8. Call it from a handler

A [command handler](../application/command-handlers.md) loads the order, calls one method, saves
it and hands its events over to the [outbox](../application/outbox.md), in one
[unit of work](../application/unit-of-work.md). The time and the ids come from the `Clock` and
`IdGenerator` [ports](./ports.md).

```ts [src/ordering/application/commands/place-order.command.ts]
return this.unitOfWork.run(async () => {
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
	const events = order
		.pullDomainEvents()
		.map((event) =>
			this.translator.translate(event, { correlationId }),
		);
	await this.outbox.add(events);
	return ok();
});
```

### 9. Check it

Run the checks. Three rules keep the aggregate the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>domain/aggregates/*.aggregate.ts</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-thrown-failure"><code>no-thrown-failure</code></a></span>Its public methods return a <code>Result</code>, and nothing is thrown.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-aggregate-reference"><code>no-aggregate-reference</code></a></span>It keeps a <code>CustomerId</code>, never a <code>Customer</code>.</div>
</div>

A setter added later is reported:

```
src/ordering/domain/aggregates/order.aggregate.ts
  42  tactical/no-thrown-failure: Order.setStatus must return a
  Result: expose reads as getters and return business failures
  as values.
```

## Troubleshooting

**`Type 'OrderSnapshot' does not satisfy the constraint 'AnySnapshot'`**: the snapshot is an
`interface`, or holds a value object or an entity. Declare it with `type` and write value objects
as plain fields.

## See also

- [Entities](./entities.md) and [Value objects](./value-objects.md), inside an aggregate
- [Domain events](./domain-events.md) and [Domain errors](./domain-errors.md), what it records and returns
- [Repositories](./repositories.md), to load and save it, and
  [Command handlers](../application/command-handlers.md), to call it
- Rules: [`tactical/no-thrown-failure`](../../rules/tactical/no-thrown-failure.md), [`tactical/no-aggregate-reference`](../../rules/tactical/no-aggregate-reference.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
- Vaughn Vernon, *Domain-Driven Design Distilled*, chapter 5, "Tactical Design with Aggregates"
- Vaughn Vernon, *Implementing Domain-Driven Design*, chapter 10, "Aggregates"
