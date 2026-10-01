# Entities

An entity is an object defined by its identity: it stays the same object while its attributes
change. Each entity has a typed `Identifier`, so identifiers of different entities cannot be mixed
up.

```ts
class OrderLineId extends Identifier<string, "OrderLineId"> {}

class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> {
	changeQuantity(quantity: number): Result<void, InvalidQuantity> { … }
}
```

## When to use

Use an entity for something you need to track over time inside an aggregate, such as a line of an
order. If it is described only by its values, use a [value object](./value-objects.md). If it has
its own consistency rules and lifecycle, make it an [aggregate](./aggregates.md).

## Usage

### Declare an identifier

One identifier class per entity. The second type parameter is a tag that TypeScript uses to keep
identifiers apart; it does not exist at runtime.

```ts [src/ordering/domain/value-objects/ids.identifier.ts]
import { Identifier } from "@alveolus/core";

export class OrderLineId extends Identifier<string, "OrderLineId"> {}
export class ProductId extends Identifier<string, "ProductId"> {}
```

```ts
const id = new OrderLineId("line_1");

id.equals(new OrderLineId("line_1")); // true
JSON.stringify({ id }); // '{"id":"line_1"}'

function load(id: OrderLineId) {}
load(new ProductId("p_1")); // compile error
```

### Declare an entity

Extend `Entity` with the identifier type and the type of its snapshot. Keep the constructor
private, change state through methods that return a [`Result`](../utilities/result.md), and
reference aggregates by their identifier. `toSnapshot()` exports the state as JSON data and a
static `fromSnapshot` rebuilds the entity, so that its aggregate can include it in
[its own snapshot](./aggregates.md#export-and-restore-a-snapshot).

```ts [src/ordering/domain/entities/order-line.entity.ts]
import { Entity, err, ok, type Result } from "@alveolus/core";
import { InvalidQuantity } from "../errors/order.error.ts";
import { OrderLineId, ProductId } from "../value-objects/ids.identifier.ts";

export type OrderLineSnapshot = { id: string; productId: string; quantity: number };

export class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> {
	readonly productId: ProductId;
	private quantity: number;

	private constructor(id: OrderLineId, productId: ProductId, quantity: number) {
		super(id);
		this.productId = productId;
		this.quantity = quantity;
	}

	static create(id: OrderLineId, productId: ProductId): OrderLine {
		return new OrderLine(id, productId, 1);
	}

	static fromSnapshot(snapshot: OrderLineSnapshot): OrderLine {
		return new OrderLine(new OrderLineId(snapshot.id), new ProductId(snapshot.productId), snapshot.quantity);
	}

	changeQuantity(quantity: number): Result<void, InvalidQuantity> {
		if (quantity <= 0) {
			return err(new InvalidQuantity({ quantity }));
		}
		this.quantity = quantity;
		return ok();
	}

	toSnapshot(): OrderLineSnapshot {
		return { id: this.id.value, productId: this.productId.value, quantity: this.quantity };
	}
}
```

### Compare entities

Two entities are equal when they are of the same class and their identifiers are equal, whatever
their other attributes.

```ts
lineA.equals(lineB); // true when both have the same OrderLineId
```

## Reference

### Identifier

```ts
abstract class Identifier<T extends IdentifierValue, Tag extends string = string>
```

| Type parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `T`            | Raw value: `string`, `number` or `bigint`.           |
| `Tag`          | Unique name of the identifier type, at compile time. |

| Member             | Type      | Description                                 |
| ------------------ | --------- | ------------------------------------------- |
| `constructor(value)` | public  | Wraps the raw value.                        |
| `value`            | `T`       | The raw value.                              |
| `equals(other)`    | `boolean` | Same class and same value.                  |
| `toString()`       | `string`  | The value as a string.                      |
| `toJSON()`         | `T`       | The raw value, used by `JSON.stringify`.    |

### Entity

```ts
abstract class Entity<Id extends AnyIdentifier, Snapshot extends JsonValue>
```

| Type parameter | Description                                |
| -------------- | ------------------------------------------ |
| `Id`           | The identifier of the entity.              |
| `Snapshot`     | The JSON data describing its state.        |

| Member            | Type                 | Description                              |
| ----------------- | -------------------- | ---------------------------------------- |
| `constructor(id)` | protected            | Sets the identifier.                     |
| `id`              | `Id`                 | The identifier of the entity.            |
| `equals(other)`   | `boolean`            | Same class and equal identifiers.        |
| `toSnapshot()`    | abstract, `Snapshot` | The state of the entity as JSON data.    |

`JsonValue` is a string, number, boolean, `null`, or an array or object of JSON values.
`AnyEntity` is any entity.

**Caveats**

- TypeScript has no abstract static method: `fromSnapshot` is checked by the
  [`entity/from-snapshot`](/arch/rules/entities) rule.

Import from `@alveolus/core` or `@alveolus/core/entities`.

## See also

- [Aggregates](./aggregates.md), which contain entities
- [Value Objects](./value-objects.md), for things described only by their values
- [Entity rules](/arch/rules/entities), checked by `alveolus arch check`
