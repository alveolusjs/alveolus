# Entities

An entity is an object inside an aggregate that keeps its identity while its attributes change.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain</dd>
	<dt>File</dt><dd><code>domain/entities/order-line.entity.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>Entity&lt;Id, Snapshot&gt;</code></a></dd>
	<dt>Called by</dt><dd>The root of its <a href="/core/domain/aggregates">aggregate</a>, and nothing else</dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/tactical/no-thrown-failure"><code>tactical/no-thrown-failure</code></a>, <a href="/rules/tactical/no-aggregate-reference"><code>tactical/no-aggregate-reference</code></a></dd>
</dl>

## Why

An order has two lines for the same product, one of 1 and one of 3. The customer changes the second
one to 0. If the lines are plain objects with a public `quantity`, nothing refuses the 0, nothing
tells the two lines apart, and nothing stops the change once the order is placed.

::: tip The fix
`OrderLine` is an entity: it has its own identifier, so the second line stays the second line, and
a `changeQuantity` method that refuses a quantity of 0. The `Order` root decides whether the line
may change at all.
:::

## How it works

An entity is defined by its identity, not by its values: two lines with the same product and
quantity are still two lines. It lives inside an [aggregate](./aggregates.md), and only the root
of that aggregate holds it and calls it.

The rules are split between the two:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>The entity keeps its own rules</span>"A quantity is at least 1" only involves the line: <code>OrderLine.changeQuantity</code> checks it.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>The root keeps the shared rules</span>"No change once placed" involves the order: <code>Order.changeLineQuantity</code> checks it, then finds the line and calls it.</div>
</div>

```ts
changeQuantity(quantity: number): Result<void, InvalidQuantity> {
	if (quantity <= 0) {
		return err(new InvalidQuantity({ quantity }));
	}
	this.currentQuantity = quantity;
	return ok();
}
```

## Where it fits

A [command handler](../application/command-handlers.md) never reaches an entity. It calls the root,
which calls the entity. The entity is saved inside the snapshot of its aggregate.

<div class="al-diagram">
<svg viewBox="0 0 680 150" role="img" aria-label="A command handler calls the Order root, which calls the OrderLine entity. The order line is saved inside the snapshot of the order.">
	<defs>
		<marker id="entity-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="24" width="160" height="56" rx="8" />
	<text class="label" x="88" y="48" text-anchor="middle">Command handler</text>
	<text class="note" x="88" y="68" text-anchor="middle">calls the root</text>
	<path class="link" d="M 168 52 L 258 52" marker-end="url(#entity-flow-arrow)" />
	<rect class="box" x="260" y="24" width="160" height="56" rx="8" />
	<text class="label" x="340" y="48" text-anchor="middle">Order</text>
	<text class="note" x="340" y="68" text-anchor="middle">changeLineQuantity()</text>
	<path class="link" d="M 420 52 L 510 52" marker-end="url(#entity-flow-arrow)" />
	<rect class="boundary" x="512" y="24" width="160" height="56" rx="8" />
	<text class="label" x="592" y="48" text-anchor="middle">OrderLine</text>
	<text class="note" x="592" y="68" text-anchor="middle">changeQuantity()</text>
	<text class="note" x="340" y="122" text-anchor="middle">saved as part of Order.toSnapshot()</text>
</svg>
</div>

::: tip
Code outside the aggregate never holds an entity. It names a line by its `OrderLineId`, and the root
finds it.
:::

## API

```ts
import { Entity } from "@alveolus/core";
// or: import { Entity } from "@alveolus/core/entities";
```

### Type parameters

```ts
abstract class Entity<
	Id extends AnyIdentifier,
	Snapshot extends AnySnapshot = AnySnapshot,
> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Id` | The [identifier](./value-objects.md#identifier) of the entity. | extends `Identifier` |
| `Snapshot` | The plain data its state is saved as. | a `type` of plain data; any by default |

A snapshot holds only `SnapshotValue`s: strings, numbers, booleans, `null`, `bigint`, `Date`, and
arrays or objects of them. `AnySnapshot` is the type of any snapshot, and `AnyEntity` the type of
any entity.

### `constructor(id)` <Badge type="info" text="protected" /> <Badge type="tip" text="you call it" />

```ts
protected constructor(id: Id)
```

Stores the identifier. Declare your own constructor `private` and call `super(id)` from it: only
your factories and `fromSnapshot` create the entity.

### `toSnapshot()` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" />

```ts
abstract toSnapshot(): Snapshot
```

Returns the state as plain data, for the snapshot of the aggregate.

### `fromSnapshot(snapshot)` <Badge type="info" text="static · convention" /> <Badge type="tip" text="you implement it" />

```ts
static fromSnapshot(snapshot: OrderLineSnapshot): OrderLine
```

Rebuilds the entity from its snapshot, through the private constructor, without checking rules.
Not declared by `Entity`: TypeScript has no abstract static methods.

### `equals(other)` <Badge type="tip" text="called by the root" />

```ts
equals(other: AnyEntity): boolean
```

`true` when `other` is the same object, or an instance of the same class with an equal
identifier, whatever the other attributes.

### `id` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by anyone" />

```ts
readonly id: Id
```

The identifier given to the constructor.

::: warning Caveats
- `equals` requires the same concrete class: an entity is never equal to an instance of a subclass
  with the same identifier.
- Declare the snapshot with `type`, not `interface`: an interface does not satisfy `AnySnapshot`.
- TypeScript has no abstract static methods: the compiler does not check that `fromSnapshot`
  exists.
- An entity has no `record`: only the root of the aggregate records domain events.
:::

## Usage

Build `OrderLine`, an entity inside the `Order` aggregate, one idea at a time. Each step shows the whole file it changes: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-name-it">Name it</a></span>Give the entity its identifier.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-it">Declare it</a></span>One class, one way in.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-make-it-storable">Make it storable</a></span>A snapshot inside the order's.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-change-it-through-a-method">Change it through a method</a></span>No setter, a business method.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-expose-reads-as-getters">Expose reads as getters</a></span>Read without changing.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-use-it-from-its-aggregate">Use it from its aggregate</a></span>Only the root holds it.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">7</span><a href="#_7-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Name it

An entity is known by its identifier: declare `OrderLineId` as an
[identifier](./value-objects.md#identifier), in `domain/value-objects/order-line-id.identifier.ts`.

### 2. Declare it

So that a line is only created through the rules of its aggregate, the constructor is private and
`create` is the only way in. As for an aggregate, `id` is passed to `super`, which stores it as
the public, read-only identifier. `currentQuantity` changes, so it is the one field that is not
`readonly`.

```ts [src/ordering/domain/entities/order-line.entity.ts]
import { Entity } from "@alveolus/core";

import { OrderLineId } from "../value-objects/order-line-id.identifier";
import { ProductId } from "../value-objects/product-id.identifier";

export class OrderLine extends Entity<OrderLineId> {
	private constructor(
		id: OrderLineId,
		private readonly productId: ProductId,
		private currentQuantity: number,
	) {
		super(id);
	}

	static create(id: OrderLineId, productId: ProductId): OrderLine {
		return new OrderLine(id, productId, 1);
	}
}
```

TypeScript now asks for `toSnapshot()`: the next step adds it.

### 3. Make it storable

The state is private, so the order saves it as a snapshot: plain, read-only data declared with
`type`. `fromSnapshot` rebuilds the line without checking any rule.

```ts [src/ordering/domain/entities/order-line.entity.ts]
import { Entity } from "@alveolus/core";

import { OrderLineId } from "../value-objects/order-line-id.identifier";
import { ProductId } from "../value-objects/product-id.identifier";

export type OrderLineSnapshot = { // [!code ++]
	readonly id: string; // [!code ++]
	readonly productId: string; // [!code ++]
	readonly quantity: number; // [!code ++]
}; // [!code ++]

export class OrderLine extends Entity<OrderLineId> { // [!code --]
export class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> { // [!code ++]
	private constructor(
		id: OrderLineId,
		private readonly productId: ProductId,
		private currentQuantity: number,
	) {
		super(id);
	}

	static create(id: OrderLineId, productId: ProductId): OrderLine {
		return new OrderLine(id, productId, 1);
	}

	static fromSnapshot(snapshot: OrderLineSnapshot): OrderLine { // [!code ++]
		return new OrderLine( // [!code ++]
			new OrderLineId(snapshot.id), // [!code ++]
			new ProductId(snapshot.productId), // [!code ++]
			snapshot.quantity, // [!code ++]
		); // [!code ++]
	} // [!code ++]

	toSnapshot(): OrderLineSnapshot { // [!code ++]
		return { // [!code ++]
			id: this.id.value, // [!code ++]
			productId: this.productId.value, // [!code ++]
			quantity: this.currentQuantity, // [!code ++]
		}; // [!code ++]
	} // [!code ++]
}
```

### 4. Change it through a method

So that no caller can skip a rule, the quantity changes through a method named after what the
business does. A wrong quantity is returned in a `Result`, and nothing changes.

```ts [src/ordering/domain/entities/order-line.entity.ts]
import { Entity } from "@alveolus/core"; // [!code --]
import { Entity, err, ok, type Result } from "@alveolus/core"; // [!code ++]

import { InvalidQuantity } from "../errors/invalid-quantity.error"; // [!code ++]
import { OrderLineId } from "../value-objects/order-line-id.identifier";
import { ProductId } from "../value-objects/product-id.identifier";

export type OrderLineSnapshot = {
	readonly id: string;
	readonly productId: string;
	readonly quantity: number;
};

export class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> {
	private constructor(
		id: OrderLineId,
		private readonly productId: ProductId,
		private currentQuantity: number,
	) {
		super(id);
	}

	static create(id: OrderLineId, productId: ProductId): OrderLine {
		return new OrderLine(id, productId, 1);
	}

	static fromSnapshot(snapshot: OrderLineSnapshot): OrderLine {
		return new OrderLine(
			new OrderLineId(snapshot.id),
			new ProductId(snapshot.productId),
			snapshot.quantity,
		);
	}

	changeQuantity(quantity: number): Result<void, InvalidQuantity> { // [!code ++]
		if (quantity <= 0) { // [!code ++]
			return err(new InvalidQuantity({ quantity })); // [!code ++]
		} // [!code ++]
		this.currentQuantity = quantity; // [!code ++]
		return ok(); // [!code ++]
	} // [!code ++]

	toSnapshot(): OrderLineSnapshot {
		return {
			id: this.id.value,
			productId: this.productId.value,
			quantity: this.currentQuantity,
		};
	}
}
```

### 5. Expose reads as getters

Callers need to read the quantity without changing it. Reads are getters: a public method must
return a `Result`, a getter does not.

```ts [src/ordering/domain/entities/order-line.entity.ts]
import { Entity, err, ok, type Result } from "@alveolus/core";

import { InvalidQuantity } from "../errors/invalid-quantity.error";
import { OrderLineId } from "../value-objects/order-line-id.identifier";
import { ProductId } from "../value-objects/product-id.identifier";

export type OrderLineSnapshot = {
	readonly id: string;
	readonly productId: string;
	readonly quantity: number;
};

export class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> {
	private constructor(
		id: OrderLineId,
		private readonly productId: ProductId,
		private currentQuantity: number,
	) {
		super(id);
	}

	static create(id: OrderLineId, productId: ProductId): OrderLine {
		return new OrderLine(id, productId, 1);
	}

	static fromSnapshot(snapshot: OrderLineSnapshot): OrderLine {
		return new OrderLine(
			new OrderLineId(snapshot.id),
			new ProductId(snapshot.productId),
			snapshot.quantity,
		);
	}

	get quantity(): number { // [!code ++]
		return this.currentQuantity; // [!code ++]
	} // [!code ++]

	changeQuantity(quantity: number): Result<void, InvalidQuantity> {
		if (quantity <= 0) {
			return err(new InvalidQuantity({ quantity }));
		}
		this.currentQuantity = quantity;
		return ok();
	}

	toSnapshot(): OrderLineSnapshot {
		return {
			id: this.id.value,
			productId: this.productId.value,
			quantity: this.currentQuantity,
		};
	}
}
```

### 6. Use it from its aggregate

Code outside the aggregate never holds a line: the [`Order`](./aggregates.md) creates it, changes
it, and saves it inside its own snapshot with `line.toSnapshot()`.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
addLine(
	lineId: OrderLineId,
	productId: ProductId,
): Result<void, OrderAlreadyPlaced> {
	if (this.isPlaced) {
		return err(new OrderAlreadyPlaced());
	}
	this.lines.push(OrderLine.create(lineId, productId));
	return ok();
}
```

### 7. Check it

Run the checks. Three rules keep the entity the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-thrown-failure"><code>no-thrown-failure</code></a></span>Its public methods return a <code>Result</code>; reads are getters.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-aggregate-reference"><code>no-aggregate-reference</code></a></span>It keeps a <code>ProductId</code>, never a <code>Product</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>domain/entities/*.entity.ts</code>.</div>
</div>

A setter added later is reported:

```
src/ordering/domain/entities/order-line.entity.ts:38
  tactical/no-thrown-failure: OrderLine.setQuantity must return
  a Result: expose reads as getters and return business failures
  as values.
```

## Troubleshooting

**`Type 'OrderLineSnapshot' does not satisfy the constraint 'AnySnapshot'`**: the snapshot is an
`interface`, or a field holds an identifier or a value object. Declare it with `type` and write
raw values (`productId: string`).

## See also

- [Aggregates](./aggregates.md), the root that owns entities
- [Value objects](./value-objects.md), for identifiers and things without identity
- [Domain errors](./domain-errors.md), what its methods return
- Rules: [`tactical/no-thrown-failure`](../../rules/tactical/no-thrown-failure.md), [`tactical/no-aggregate-reference`](../../rules/tactical/no-aggregate-reference.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
- Vaughn Vernon, *Implementing Domain-Driven Design*, chapter 5, "Entities"
