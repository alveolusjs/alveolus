# Views

A view is the read-only shape a query returns, built for the screen or the API that shows it.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain</dd>
	<dt>File</dt><dd><code>domain/views/order-summary.view.ts</code></dd>
	<dt>Type</dt><dd><a href="#api"><code>View&lt;Props&gt;</code></a></dd>
	<dt>Read by</dt><dd><a href="/core/domain/repositories">Query repositories</a></dd>
	<dt>Returned by</dt><dd><a href="/core/application/query-handlers">Query handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-mixed-handler"><code>tactical/no-mixed-handler</code></a></dd>
</dl>

## Why

The orders screen shows each order's status and number of lines. Loading fifty `Order` aggregates,
with all their lines, just to count them is slow. It also hands the screen an object with
`place()` and `addLine()`: a read could change an order.

::: tip The fix
A view is a plain read-only type shaped for that screen: `OrderSummary`. A query repository builds
it straight from storage, without loading the aggregate. It carries data, so reading can never
write.
:::

## How it works

An aggregate and a view describe the same order for two different jobs.

| | Aggregate | View |
| --- | --- | --- |
| **Shaped for** | the business rules | a screen or an API |
| **Has methods** | yes, the business methods | no, only fields |
| **Read through** | a command repository | a query repository |
| **Can change** | through its methods | never |

```ts
export type OrderSummary = View<{
	readonly id: OrderId;
	readonly customerId: CustomerId;
	readonly status: "draft" | "placed";
	readonly lineCount: number;
}>;
```

## Where it fits

A query never touches the aggregate. The [query handler](../application/query-handlers.md) asks a
[query repository](./repositories.md) for the view, and returns it.

<div class="al-diagram">
<svg viewBox="0 0 680 200" role="img" aria-label="A request goes from a controller to the GetOrderSummaryHandler, which asks the OrderSummaries query repository and returns an OrderSummary view.">
	<defs>
		<marker id="view-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="72" width="130" height="56" rx="8" />
	<text class="label" x="73" y="96" text-anchor="middle">Controller</text>
	<text class="note" x="73" y="116" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 100 L 168 100" marker-end="url(#view-flow-arrow)" />
	<rect class="box" x="170" y="72" width="210" height="56" rx="8" />
	<text class="label" x="275" y="96" text-anchor="middle">GetOrderSummaryHandler</text>
	<text class="note" x="275" y="116" text-anchor="middle">query handler</text>
	<rect class="box" x="440" y="36" width="232" height="48" rx="8" />
	<text class="label" x="556" y="56" text-anchor="middle">1 · summaries.summaryOf(id)</text>
	<text class="note" x="556" y="74" text-anchor="middle">reads storage, no aggregate</text>
	<rect class="boundary" x="440" y="116" width="232" height="48" rx="8" />
	<text class="label" x="556" y="136" text-anchor="middle">2 · OrderSummary</text>
	<text class="note" x="556" y="154" text-anchor="middle">this page: what it returns</text>
	<path class="link" d="M 380 100 L 438 60" marker-end="url(#view-flow-arrow)" />
	<path class="link" d="M 438 140 L 382 104" marker-end="url(#view-flow-arrow)" />
</svg>
</div>

::: tip
The driving adapter turns the view into its response, or into a
[representation](../strategic/published-language.md) for another context.
:::

## API

```ts
import type { View } from "@alveolus/core";
// or: import type { View } from "@alveolus/core/views";
```

### Type parameters

```ts
type View<Props extends object> = Readonly<Props>;
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Props` | The fields of the view. | an object type |

### Declaration

```ts
type OrderSummary = View<{
	readonly id: OrderId;
	readonly lineCount: number;
}>;
```

The view, in `domain/views/`: the fields the reader needs, read-only. It has no members.

::: warning Caveats
- `View` changes nothing at runtime: it is `Readonly<Props>`. It marks the type as the answer of a
  query, for you and for your reviewers.
- `Readonly` is shallow: nested arrays and objects stay mutable unless you declare them `readonly`.
- No separate read model is implied: views are read from the same storage as the aggregates. CQRS
  with separate stores is out of scope.
:::

## Usage

Build `OrderSummary`, what a screen shows for one order, then the query repository and the adapter
that read it. Each step shows the whole file it changes: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-know-who-reads-it">Know who reads it</a></span>One screen, one answer.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-view">Declare the view</a></span>Read-only data, no behaviour.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-declare-where-it-comes-from">Declare where it comes from</a></span>A query repository.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-build-it-from-storage">Build it from storage</a></span>No aggregate loaded.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-return-it-from-a-query-handler">Return it from a query handler</a></span>The query side only.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Know who reads it

A view answers one screen or one API response: here, the summary of an order, read without
loading the [`Order` aggregate](./aggregates.md).

### 2. Declare the view

A view is plain, read-only data shaped for its reader: a `View` type, not a class, so it has no
behaviour to keep in sync with the model.

```ts [src/ordering/domain/views/order-summary.view.ts]
import type { View } from "@alveolus/core";

import type {
	CustomerId,
} from "../value-objects/customer-id.identifier";
import type { OrderId } from "../value-objects/order-id.identifier";

export type OrderSummary = View<{
	readonly id: OrderId;
	readonly customerId: CustomerId;
	readonly status: "draft" | "placed";
	readonly lineCount: number;
}>;
```

### 3. Declare where it comes from

The query side gets its own [repository](./repositories.md#queryrepository), declared in the
domain, that returns views only.

```ts [src/ordering/domain/repositories/order-summaries.repository.ts]
import { QueryRepository } from "@alveolus/core";

import type { OrderId } from "../value-objects/order-id.identifier";
import type { OrderSummary } from "../views/order-summary.view";

export abstract class OrderSummaries extends QueryRepository<
	OrderSummary
> {
	abstract summaryOf(id: OrderId): Promise<OrderSummary | undefined>;
}
```

### 4. Build it from storage

The adapter reads the storage and shapes the view directly: no aggregate is loaded, no rule runs.

```ts [src/ordering/driven/pg/adapters/pg-order-summaries.adapter.ts]
import {
	OrderSummaries,
} from "../../../domain/repositories/order-summaries.repository";
import {
	CustomerId,
} from "../../../domain/value-objects/customer-id.identifier";
import {
	OrderId,
} from "../../../domain/value-objects/order-id.identifier";
import type {
	OrderSummary,
} from "../../../domain/views/order-summary.view";

export class PgOrderSummaries extends OrderSummaries {
	constructor(private readonly db: Database) {
		super();
	}

	async summaryOf(id: OrderId): Promise<OrderSummary | undefined> {
		const row = await this.db
			.selectFrom("orders")
			.where("id", "=", id.value)
			.selectAll()
			.executeTakeFirst();
		if (row === undefined) {
			return undefined;
		}
		return {
			id: new OrderId(row.id),
			customerId: new CustomerId(row.customer_id),
			status: row.status,
			lineCount: row.lines.length,
		};
	}
}
```

### 5. Return it from a query handler

A [query handler](../application/query-handlers.md) asks the query repository and returns the
view as it is.

```ts [src/ordering/application/queries/get-order-summary.query.ts]
const summary = await this.summaries.summaryOf(
	new OrderId(orderId),
);
if (summary === undefined) {
	return err(new OrderNotFound({ orderId }));
}
return ok(summary);
```

### 6. Check it

Run the checks. Two rules keep the view on the query side:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-mixed-handler"><code>no-mixed-handler</code></a></span>Only query handlers receive <code>OrderSummaries</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-portless-adapter"><code>no-portless-adapter</code></a></span><code>PgOrderSummaries</code> extends the query repository it implements.</div>
</div>

A command handler that reads it is reported:

```
src/ordering/application/commands/place-order.command.ts:47
  tactical/no-mixed-handler: The CommandHandler PlaceOrderHandler
  receives OrderSummaries, a QueryRepository: keep commands and
  queries apart.
```

## See also

- [Repositories](./repositories.md), the query repository that returns a view
- [Query handlers](../application/query-handlers.md), which return views
- [Aggregates](./aggregates.md), the write side of the same data
- [Published Language](../strategic/published-language.md), when a view leaves the context
- Rules: [`tactical/no-mixed-handler`](../../rules/tactical/no-mixed-handler.md)
