---
description: "Repositories in Domain-Driven Design with TypeScript: ports that load and save aggregates for commands and views for queries, as if they were collections."
---

# Repositories

A repository is a port that loads and saves what the application works on, as if it were a
collection: aggregates for commands, views for queries.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain, implemented by a driven adapter</dd>
	<dt>File</dt><dd><code>domain/repositories/orders.repository.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>CommandRepository&lt;Aggregate&gt;</code></a>, <a href="#api"><code>QueryRepository&lt;View&gt;</code></a></dd>
	<dt>Used by</dt><dd><a href="/core/application/command-handlers">Command handlers</a>, <a href="/core/application/query-handlers">query handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/tactical/no-query-in-command"><code>tactical/no-query-in-command</code></a>, <a href="/rules/tactical/no-command-in-query"><code>tactical/no-command-in-query</code></a>, <a href="/rules/layers/no-portless-adapter"><code>layers/no-portless-adapter</code></a></dd>
</dl>

## Why

Placing an order loads it, changes it and saves it. If the handler writes the SQL, it must reach
into the private fields of `Order` to store them, every handler that touches orders repeats the
mapping, and no handler runs without a database.

::: tip The fix
The domain declares `Orders`, a collection of orders: `findById` and `save`. An adapter stores the
order's snapshot in its tables. The handler asks the collection and never sees a table.
:::

## How it works

Alveolus splits repositories by side. A command needs the aggregate, with its rules. A query needs
a shape to show, without loading the aggregate.

| | Command repository | Query repository |
| --- | --- | --- |
| **Hands out** | an [aggregate](./aggregates.md) | a [view](./views.md) |
| **Extends** | `CommandRepository<Order>` | `QueryRepository<OrderSummary>` |
| **Used by** | [command handlers](../application/command-handlers.md) | [query handlers](../application/query-handlers.md) |
| **Methods** | `findById`, `save`, and yours | yours, read only |

The adapter of a command repository goes through the aggregate's snapshot, never its fields:

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>findById</span>Read the row, rebuild the aggregate with <code>Order.fromSnapshot(…)</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>save</span>Take <code>order.toSnapshot()</code>, write it to the tables.</div>
</div>

```ts
export abstract class Orders extends CommandRepository<Order> {}

export abstract class OrderSummaries extends QueryRepository<
	OrderSummary
> {
	abstract summaryOf(id: OrderId): Promise<OrderSummary | undefined>;
}
```

## Where it fits

In the PlaceOrder flow, the command handler uses the repository twice: to load the order, and to
save it once changed.

<div class="al-diagram">
<svg viewBox="0 0 680 300" role="img" aria-label="The PlaceOrderHandler loads the Order through the Orders repository, calls order.place, saves the order through the repository and adds its events to the outbox.">
	<defs>
		<marker id="repository-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="122" width="130" height="56" rx="8" />
	<text class="label" x="73" y="146" text-anchor="middle">Controller</text>
	<text class="note" x="73" y="166" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 150 L 178 150" marker-end="url(#repository-flow-arrow)" />
	<rect class="box" x="180" y="122" width="180" height="56" rx="8" />
	<text class="label" x="270" y="146" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="270" y="166" text-anchor="middle">command handler</text>
	<text class="note" x="270" y="204" text-anchor="middle">one unit of work</text>
	<rect class="boundary" x="440" y="24" width="232" height="48" rx="8" />
	<text class="label" x="556" y="44" text-anchor="middle">1 · orders.findById(id)</text>
	<text class="note" x="556" y="62" text-anchor="middle">this page: loads it</text>
	<rect class="box" x="440" y="92" width="232" height="48" rx="8" />
	<text class="label" x="556" y="112" text-anchor="middle">2 · order.place(…)</text>
	<text class="note" x="556" y="130" text-anchor="middle">rules + event</text>
	<rect class="boundary" x="440" y="160" width="232" height="48" rx="8" />
	<text class="label" x="556" y="180" text-anchor="middle">3 · orders.save(order)</text>
	<text class="note" x="556" y="198" text-anchor="middle">this page: stores it</text>
	<rect class="box" x="440" y="228" width="232" height="48" rx="8" />
	<text class="label" x="556" y="248" text-anchor="middle">4 · outbox.add(events)</text>
	<text class="note" x="556" y="266" text-anchor="middle">hands over its events</text>
	<path class="link" d="M 360 150 L 438 48" marker-end="url(#repository-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 116" marker-end="url(#repository-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 184" marker-end="url(#repository-flow-arrow)" />
	<path class="link" d="M 360 150 L 438 252" marker-end="url(#repository-flow-arrow)" />
</svg>
</div>

::: tip
A query takes the other side: the [query handler](../application/query-handlers.md) asks a query
repository for a [view](./views.md), and no aggregate is loaded.
:::

## API

```ts
import { CommandRepository, QueryRepository } from "@alveolus/core";
// or: from "@alveolus/core/repositories"
```

### Type parameters

```ts
abstract class CommandRepository<
	Aggregate extends AnyAggregateRoot,
> extends Port { … }

abstract class QueryRepository<View extends object> extends Port {}
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Aggregate` | The aggregate a command repository holds. | extends `AggregateRoot` |
| `View` | The view a query repository reads. | an object type |

### CommandRepository

#### `findById(id)` <Badge type="info" text="abstract" /> <Badge type="tip" text="called by the command handler" />

```ts
abstract findById(
	id: Aggregate["id"],
): Promise<Aggregate | undefined>
```

Loads the aggregate by its identifier; `undefined` when it is missing. Only the identifier of its
aggregate compiles.

#### `save(aggregate)` <Badge type="info" text="abstract" /> <Badge type="tip" text="called by the command handler" />

```ts
abstract save(aggregate: Aggregate): Promise<void>
```

Stores the aggregate. It leaves the pending events: the handler pulls them after.

Declare the repository abstract in `domain/repositories/`, with the methods your commands need,
and implement it in `driven/<technology>/adapters/`:

```ts
abstract class Orders extends CommandRepository<Order> {}
class PgOrders extends Orders { … }
```

### QueryRepository

```ts
abstract class OrderSummaries extends QueryRepository<OrderSummary> {
	abstract findById(id: OrderId): Promise<OrderSummary | undefined>;
}
```

`QueryRepository` has no members of its own: declare the abstract methods your queries need. They
are called by the query handler and hand out the view, or a collection of it.

::: warning Caveats
- `findById` only accepts the identifier of its aggregate: passing an `OrderId` to a
  `Customers` repository does not compile.
- A command handler depends on command repositories only, a query handler on query repositories
  only ([`tactical/no-query-in-command`](../../rules/tactical/no-query-in-command.md), [`tactical/no-command-in-query`](../../rules/tactical/no-command-in-query.md)).
- No version is kept: to prevent lost updates, put a `version` in the snapshot and check it in the
  adapter's `UPDATE`.
:::

## Usage

Build `Orders`, the command repository of the `Order` aggregate, then implement it with
PostgreSQL. Each step shows the whole file it changes: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-know-what-it-stores">Know what it stores</a></span>One aggregate, as a snapshot.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-repository">Declare the repository</a></span>An abstract class in the domain.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-add-what-the-commands-need">Add what the commands need</a></span>And nothing for screens.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-implement-it-in-a-driven-adapter">Implement it in a driven adapter</a></span>Snapshot in, snapshot out.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-use-it-from-a-handler">Use it from a handler</a></span>Load, change, save.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Know what it stores

A command repository loads and saves one aggregate as a whole: here the
[`Order` aggregate](./aggregates.md), saved as its `OrderSnapshot`.

### 2. Declare the repository

So that the domain loads and saves an order without knowing the database, the repository is an
abstract class named after the collection. `findById` and `save` come with `CommandRepository`.

```ts [src/ordering/domain/repositories/orders.repository.ts]
import { CommandRepository } from "@alveolus/core";

import type { Order } from "../aggregates/order.aggregate";

export abstract class Orders extends CommandRepository<Order> {}
```

### 3. Add what the commands need

Add only what a command needs, in the words of the domain: here, the drafts of a customer. Reads
for a screen go to a [query repository](#queryrepository) instead.

```ts [src/ordering/domain/repositories/orders.repository.ts]
import { CommandRepository } from "@alveolus/core";

import type { Order } from "../aggregates/order.aggregate";
import type { // [!code ++]
	CustomerId, // [!code ++]
} from "../value-objects/customer-id.identifier"; // [!code ++]

export abstract class Orders extends CommandRepository<Order> {} // [!code --]
export abstract class Orders extends CommandRepository<Order> { // [!code ++]
	abstract findDraftsOf( // [!code ++]
		customerId: CustomerId, // [!code ++]
	): Promise<readonly Order[]>; // [!code ++]
} // [!code ++]
```

### 4. Implement it in a driven adapter

The adapter maps the snapshot to storage: `toSnapshot()` to write, `fromSnapshot()` to read. The
aggregate never sees a row.

```ts [src/ordering/driven/pg/adapters/pg-orders.adapter.ts]
import { Order } from "../../../domain/aggregates/order.aggregate";
import {
	Orders,
} from "../../../domain/repositories/orders.repository";
import type {
	CustomerId,
} from "../../../domain/value-objects/customer-id.identifier";
import type {
	OrderId,
} from "../../../domain/value-objects/order-id.identifier";

export class PgOrders extends Orders {
	constructor(private readonly db: Database) {
		super();
	}

	async findById(id: OrderId): Promise<Order | undefined> {
		const row = await this.db
			.selectFrom("orders")
			.where("id", "=", id.value)
			.selectAll()
			.executeTakeFirst();
		if (row === undefined) {
			return undefined;
		}
		return Order.fromSnapshot({
			id: row.id,
			customerId: row.customer_id,
			status: row.status,
			lines: row.lines,
		});
	}

	async save(order: Order): Promise<void> {
		const snapshot = order.toSnapshot();
		const row = {
			id: snapshot.id,
			customer_id: snapshot.customerId,
			status: snapshot.status,
			lines: JSON.stringify(snapshot.lines),
		};
		await this.db
			.insertInto("orders")
			.values(row)
			.onConflict((conflict) =>
				conflict.column("id").doUpdateSet(row),
			)
			.execute();
	}

	async findDraftsOf(
		customerId: CustomerId,
	): Promise<readonly Order[]> { … }
}
```

### 5. Use it from a handler

A [command handler](../application/command-handlers.md) loads the order, calls one business
method and saves it, in one unit of work.

```ts [src/ordering/application/commands/place-order.command.ts]
const order = await this.orders.findById(new OrderId(orderId));
if (order === undefined) {
	return err(new OrderNotFound({ orderId }));
}
const placed = order.place(this.ids.next(), this.clock.now());
if (!placed.ok) {
	return placed;
}
await this.orders.save(order);
```

### 6. Check it

Run the checks. Three rules keep the repository the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-portless-adapter"><code>no-portless-adapter</code></a></span><code>PgOrders</code> extends <code>Orders</code>, declared in <code>domain/repositories/</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-command-in-query"><code>no-command-in-query</code></a></span>Only command handlers receive <code>Orders</code>; queries read views.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>domain/repositories/*.repository.ts</code>.</div>
</div>

A query handler that receives it is reported:

```
src/ordering/application/queries/get-order-summary.query.ts:20
  tactical/no-command-in-query: The QueryHandler
  GetOrderSummaryHandler receives Orders, a CommandRepository: a
  query reads views and writes nothing.
```

## See also

- [Aggregates](./aggregates.md), what a command repository holds, and their snapshots
- [Views](./views.md), what a query repository returns
- [Ports](./ports.md), the other dependencies of the domain
- Rules: [`tactical/no-query-in-command`](../../rules/tactical/no-query-in-command.md), [`tactical/no-command-in-query`](../../rules/tactical/no-command-in-query.md), [`layers/no-portless-adapter`](../../rules/layers/no-portless-adapter.md)
- Vaughn Vernon, *Implementing Domain-Driven Design*, chapter 12, "Repositories"
