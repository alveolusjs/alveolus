# Entities

An entity is an object defined by its identity: it stays the same object while its attributes
change. It lives inside an [aggregate](./aggregates.md), exposes behaviour rather than setters, and
saves its state as a snapshot.

```ts
export class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> {
	changeQuantity(quantity: number): Result<void, InvalidQuantity> { … }

	toSnapshot(): OrderLineSnapshot { … }
}
```

## When to use

Use an entity for something you track over time inside an aggregate, such as a line of an order:
two lines with the same product and quantity are still two lines. If it is described only by its
values, use a [value object](./value-objects.md). If it has its own consistency rules and
lifecycle, make it an [aggregate](./aggregates.md).

## Usage

### Declare an entity

Extend `Entity` with its identifier and its snapshot type. Keep the constructor private, change
state through methods that return a [`Result`](../utilities/result.md), and expose reads as
getters.

```ts [src/ordering/domain/entities/order-line.entity.ts]
import { Entity, err, ok, type Result } from "@alveolus/core";

import { InvalidQuantity } from "../errors/invalid-quantity.error";
import { OrderLineId } from "../value-objects/order-line-id.identifier";
import { ProductId } from "../value-objects/product-id.identifier";

export type OrderLineSnapshot = { id: string; productId: string; quantity: number };

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
		return new OrderLine(new OrderLineId(snapshot.id), new ProductId(snapshot.productId), snapshot.quantity);
	}

	get quantity(): number {
		return this.currentQuantity;
	}

	changeQuantity(quantity: number): Result<void, InvalidQuantity> {
		if (quantity <= 0) {
			return err(new InvalidQuantity({ quantity }));
		}
		this.currentQuantity = quantity;
		return ok();
	}

	toSnapshot(): OrderLineSnapshot {
		return { id: this.id.value, productId: this.productId.value, quantity: this.currentQuantity };
	}
}
```

The product is referenced by its identifier: an entity, like an aggregate, never holds another
aggregate ([`reference-by-identity`](../../rules/reference-by-identity.md)).

### Expose behaviour, not setters

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/entities/order-line.entity.ts]
set quantity(quantity: number) {
	this.currentQuantity = quantity;
}
```

```ts [✅ Prefer: src/ordering/domain/entities/order-line.entity.ts]
changeQuantity(quantity: number): Result<void, InvalidQuantity> {
	if (quantity <= 0) {
		return err(new InvalidQuantity({ quantity }));
	}
	this.currentQuantity = quantity;
	return ok();
}
```

</div>

A setter accepts any value; a business method protects the rule and says, in its signature, how it
can fail. Every public method of an entity returns a `Result`
([`errors-as-values`](../../rules/errors-as-values.md)).

### Change it through its aggregate

Code outside the aggregate never changes an entity directly: it calls the root, which finds the
entity, applies the change and records the event. Only the root records events; an entity has no
`record`.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
changeLineQuantity(lineId: OrderLineId, quantity: number): Result<void, LineNotFound | InvalidQuantity> {
	const line = this.lines.find((candidate) => candidate.id.equals(lineId));
	if (line === undefined) {
		return err(new LineNotFound({ lineId: lineId.value }));
	}
	return line.changeQuantity(quantity);
}
```

### Save it inside the snapshot of its aggregate

An entity returns its state as plain data with `toSnapshot()` and is rebuilt by a static
`fromSnapshot`. The root composes the snapshots of its entities.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
export type OrderSnapshot = { id: string; lines: readonly OrderLineSnapshot[] };

toSnapshot(): OrderSnapshot {
	return { id: this.id.value, lines: this.lines.map((line) => line.toSnapshot()) };
}
```

A snapshot holds only `SnapshotValue`s: strings, numbers, booleans, `null`, `bigint`, `Date`, and
arrays or objects of them. Identifiers and value objects are written as their raw values.

### Compare entities

Two entities are equal when they are of the same class and their identifiers are equal, whatever
their other attributes.

```ts
lineA.equals(lineB);
```

## Reference

```ts
abstract class Entity<Id extends AnyIdentifier, Snapshot extends AnySnapshot = AnySnapshot>

type SnapshotValue = string | number | boolean | null | bigint | Date | readonly SnapshotValue[] | { readonly [key: string]: SnapshotValue };
type AnySnapshot = { readonly [key: string]: SnapshotValue };
```

| Type parameter | Description |
| --- | --- |
| `Id` | The [identifier](./value-objects.md#identifiers) of the entity. |
| `Snapshot` | The plain data its state is saved as. |

| Member | Type | Description |
| --- | --- | --- |
| `constructor(id)` | protected | Sets the identifier. |
| `id` | `Id` | The identifier, read-only. |
| `equals(other)` | `boolean` | Same concrete class and equal identifiers. |
| `toSnapshot()` | abstract, `Snapshot` | Returns the state as plain data. |
| `fromSnapshot(snapshot)` | static, by convention | Rebuilds the entity. Written by you. |

`AnyEntity` is the type of any entity.

**Caveats**

- `equals` requires the same concrete class: an entity is never equal to an instance of a subclass
  with the same identifier.
- Declare the snapshot with `type`, not `interface`: an interface does not satisfy `AnySnapshot`.
- TypeScript has no abstract static methods: `fromSnapshot` is a convention.

Import from `@alveolus/core` or `@alveolus/core/entities`.

## Troubleshooting

**`Type 'OrderLineSnapshot' does not satisfy the constraint 'AnySnapshot'`**: the snapshot is an
`interface`, or a field holds an identifier or a value object. Declare it with `type` and write
raw values (`productId: string`).

## See also

- [Aggregates](./aggregates.md), the root that owns entities
- [Value objects](./value-objects.md), for identifiers and things without identity
- Rules: [`errors-as-values`](../../rules/errors-as-values.md), [`reference-by-identity`](../../rules/reference-by-identity.md), [`placement`](../../rules/placement.md)
