# Repositories

A repository loads and saves what the application works on, as if it were a collection. Alveolus
splits them by side: a **command repository** hands out the aggregates a command changes, a
**query repository** hands out the [views](./views.md) a query reads.

```ts
export abstract class Orders extends CommandRepository<Order> {}

export abstract class OrderSummaries extends QueryRepository<OrderSummary> {
	abstract summaryOf(id: OrderId): Promise<OrderSummary | undefined>;
}
```

## When to use

Declare a command repository for each aggregate a [command handler](../application/command-handlers.md)
loads, and a query repository for each view a [query handler](../application/query-handlers.md)
returns. A command decides on the aggregate, with its rules; a query reads what it shows without
loading the aggregate. Other dependencies stay [ports](./ports.md).

## Usage

### Declare a command repository

Extend `CommandRepository` with the aggregate, in `domain/repositories/`. It already has
`findById(id)` and `save(aggregate)`; add the operations your commands need.

```ts [src/ordering/domain/repositories/orders.repository.ts]
import { CommandRepository } from "@alveolus/core";

import type { Order } from "../aggregates/order.aggregate";
import type { CustomerId } from "../value-objects/customer-id.identifier";
import type { OrderId } from "../value-objects/order-id.identifier";

export abstract class Orders extends CommandRepository<Order> {
	abstract findByCustomer(id: CustomerId): Promise<readonly Order[]>;
	abstract exists(id: OrderId): Promise<boolean>;
}
```

A command repository's methods hand out its aggregate or a collection of it (array, `Map`, `Set`),
write (`void`), or answer a question (`boolean`, `number`).

### Declare a query repository

Extend `QueryRepository` with the view. Each method hands out the view or a collection of it; a
query repository writes nothing.

```ts [src/ordering/domain/repositories/order-summaries.repository.ts]
import { QueryRepository } from "@alveolus/core";

import type { OrderSummary } from "../views/order-summary.view";
import type { OrderId } from "../value-objects/order-id.identifier";

export abstract class OrderSummaries extends QueryRepository<OrderSummary> {
	abstract summaryOf(id: OrderId): Promise<OrderSummary | undefined>;
	abstract latest(limit: number): Promise<readonly OrderSummary[]>;
}
```

### Implement a command repository with snapshots

The adapter lives in `driven/<technology>/adapters/`. It stores the
[snapshot](./aggregates.md) of the aggregate and rebuilds it with `fromSnapshot`: it maps plain
data to its tables and never touches the private state of the aggregate.

```ts [src/ordering/driven/pg/adapters/pg-orders.adapter.ts]
import { Order } from "../../../domain/aggregates/order.aggregate";
import { Orders } from "../../../domain/repositories/orders.repository";
import type { OrderId } from "../../../domain/value-objects/order-id.identifier";

export class PgOrders extends Orders {
	constructor(private readonly db: Database) {
		super();
	}

	async findById(id: OrderId): Promise<Order | undefined> {
		const row = await this.db.selectFrom("orders").where("id", "=", id.value).selectAll().executeTakeFirst();
		return row === undefined ? undefined : Order.fromSnapshot({ id: row.id, total: row.total });
	}

	async save(order: Order): Promise<void> {
		const snapshot = order.toSnapshot();
		await this.db.insertInto("orders").values(snapshot).onConflict((conflict) => conflict.column("id").doUpdateSet(snapshot)).execute();
	}
}
```

To protect against concurrent writes, put a `version` in the snapshot and check it in the `UPDATE`:
core leaves concurrency to the adapter.

One adapter may implement both sides of the same storage:
`class PgOrders extends Orders implements OrderSummaries`.

### Save, then record the events

`save` leaves the pending domain events on the aggregate. In the same
[unit of work](../application/unit-of-work.md), the command handler adds them to the
[outbox](../application/outbox.md).

```ts [src/ordering/application/commands/place-order.command.ts]
await this.orders.save(order);
await this.outbox.add(order.pullDomainEvents().map((event) => this.translator.translate(event, { correlationId })));
```

### Keep commands and queries apart

<div class="al-compare">

```ts [❌ Avoid: src/ordering/application/commands/place-order.command.ts]
export class PlaceOrderHandler extends CommandHandler<PlaceOrder> {
	constructor(private readonly summaries: OrderSummaries) {
		super();
	}
}
```

```ts [✅ Prefer: src/ordering/application/commands/place-order.command.ts]
export class PlaceOrderHandler extends CommandHandler<PlaceOrder> {
	constructor(private readonly orders: Orders) {
		super();
	}
}
```

</div>

::: details Why?
A view is shaped for reading and does not protect the business rules; the aggregate does. A command
that decides from a view decides from the wrong thing.
`alveolus arch check` reports it ([`command-query-separation`](../../rules/command-query-separation.md)).
:::

## Reference

```ts
abstract class CommandRepository<Aggregate extends AnyAggregateRoot> extends Port
abstract class QueryRepository<View extends object> extends Port
```

| Type parameter | Description |
| --- | --- |
| `Aggregate` | The aggregate root held by a command repository. |
| `View` | The view read by a query repository. |

| Member | Type | Description |
| --- | --- | --- |
| `CommandRepository.findById(id)` | abstract, `Promise<Aggregate \| undefined>` | Loads the aggregate by its identifier; `undefined` when missing. |
| `CommandRepository.save(aggregate)` | abstract, `Promise<void>` | Stores the aggregate; leaves its pending events. |

`QueryRepository` has no members: declare the methods your queries need.

**Caveats**

- `findById` only accepts the identifier of its aggregate: passing an `OrderId` to a
  `Customers` repository does not compile.
- One repository per aggregate or view: a method returning another aggregate belongs to another
  repository.
- A command handler depends on command repositories only, a query handler on query repositories
  only.
- Repositories are declared in `domain/repositories/*.repository.ts`
  ([`placement`](../../rules/placement.md)).

Import from `@alveolus/core` or `@alveolus/core/repositories`.

## Troubleshooting

**`Nest can't resolve dependencies of PlaceOrderHandler (?, …)`**: the repository is imported with
`import type`, or no provider is registered for it. Import it as a value and register
`{ provide: Orders, useClass: PgOrders }`.

## See also

- [Aggregates](./aggregates.md), what a command repository holds, and their snapshots
- [Views](./views.md), what a query repository returns
- [Ports](./ports.md), the other dependencies of the domain
- [`command-query-separation`](../../rules/command-query-separation.md)
