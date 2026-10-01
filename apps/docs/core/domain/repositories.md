# Repositories

A repository loads and saves the aggregates of one type, as if they were in a collection. The
domain declares it as an interface (a port); a driven adapter implements it with a database.

```ts
export interface OrderRepository extends Repository<Order> {}
```

## When to use

Declare one repository per [aggregate](./aggregates.md), and none for entities or value objects:
they are loaded and saved with their aggregate. Use cases call the repository; aggregates never do.

## Usage

### Declare a repository

Extend `Repository` in the `domain/repositories/` folder of the bounded context. Add the queries
your use cases need, still returning aggregates.

```ts [src/ordering/domain/repositories/order.repository.ts]
import type { Repository } from "@alveolus/core";
import type { Order } from "../aggregates/order.aggregate.ts";
import type { CustomerId } from "../value-objects/customer-id.identifier.ts";

export interface OrderRepository extends Repository<Order> {
	findByCustomer(customerId: CustomerId): Promise<Order[]>;
}
```

### Implement it

The adapter lives in `driven/`. It stores the [snapshot](./aggregates.md#export-and-restore-a-snapshot)
of the aggregate, rebuilds it with `fromSnapshot`, and rejects a save when the stored version has
changed since the aggregate was loaded.

```ts [src/ordering/driven/pg-order-repository.ts]
export class PgOrderRepository implements OrderRepository {
	async findById(id: OrderId): Promise<Order | undefined> {
		const { rows } = await this.db.query("SELECT data, version FROM orders WHERE id = $1", [id.value]);
		const row = rows[0];
		return row === undefined ? undefined : Order.fromSnapshot(row.data, row.version);
	}

	async save(order: Order): Promise<void> {
		const { rowCount } = await this.db.query(
			"UPDATE orders SET data = $1, version = version + 1 WHERE id = $2 AND version = $3",
			[order.toSnapshot(), order.id.value, order.version],
		);
		if (rowCount === 0) {
			throw new ConcurrencyError(order, await this.storedVersion(order.id));
		}
	}
}
```

### Load, change and save

The use case loads the aggregate, calls it, saves it, then publishes its events. `save` leaves the
events on the aggregate.

```ts
const order = await orders.findById(id);
if (order === undefined) {
	return err(new OrderNotFound({ id: id.value }));
}
const placed = order.place(42, now);
if (!placed.ok) {
	return placed;
}
await orders.save(order);
await publisher.publish(order.pullDomainEvents());
return ok();
```

### Handle concurrent writes

`ConcurrencyError` is a technical failure, so it is thrown rather than returned. Catch it in the
application layer to reload and retry, or to report a conflict.

```ts
try {
	await orders.save(order);
} catch (error) {
	if (error instanceof ConcurrencyError) {
		return err(new OrderChangedMeanwhile());
	}
	throw error;
}
```

## Reference

```ts
interface Repository<Aggregate extends AnyAggregateRoot>
```

| Type parameter | Description                                |
| -------------- | ------------------------------------------ |
| `Aggregate`    | The aggregate root stored by the repository. |

| Member              | Type                                   | Description                                                          |
| ------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `findById(id)`      | `Promise<Aggregate \| undefined>`      | The aggregate with this identifier, or `undefined`.                  |
| `save(aggregate)`   | `Promise<void>`                        | Persists the aggregate. Throws `ConcurrencyError` on a version conflict. |

```ts
class ConcurrencyError extends Error
```

| Member                         | Type            | Description                                  |
| ------------------------------ | --------------- | -------------------------------------------- |
| `constructor(aggregate, actualVersion)` | public | The aggregate being saved and the stored version. |
| `aggregateType`                | `string`        | The class name of the aggregate.             |
| `aggregateId`                  | `AnyIdentifier` | Its identifier.                              |
| `expectedVersion`              | `number`        | The version it was loaded at.                |
| `actualVersion`                | `number`        | The version found in storage.                |

**Caveats**

- `save` does not clear the domain events of the aggregate: call `pullDomainEvents()` after saving.
- `findById` takes the identifier type of the aggregate, so `findById(customerId)` does not compile.

Import from `@alveolus/core` or `@alveolus/core/repositories`.

## Troubleshooting

### `Cannot save <Aggregate> <id>: loaded at version <n>, but the stored version is <m>`

Someone saved the aggregate after you loaded it, or you saved the same instance twice. Load it again
before changing it.

## See also

- [Aggregates](./aggregates.md), what a repository stores
- [Repository rules](/arch/rules/repositories), checked by `alveolus arch check`
- [Aggregates](./aggregates.md#export-and-restore-a-snapshot), to export and restore a snapshot
- [Query handlers](../application/query-handlers.md#build-a-view-from-an-aggregate), to build views from a snapshot
