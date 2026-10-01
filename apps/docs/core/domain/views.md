# Views

A view is what a query returns: a read-only shape, free in its fields, built for the screen or the
API that needs it. It is read through a [query repository](./repositories.md) without loading the
aggregate.

```ts
export type OrderSummary = View<{ id: OrderId; total: Money; placedAt: Date | null }>;
```

## When to use

Declare a view for each answer a [query handler](../application/query-handlers.md) gives: a
summary, a list row, a detail page. A view describes what is read, not how the business works: it
has no methods and protects no rule. When a use case changes something, it goes through the
aggregate, never through a view.

## Usage

### Declare a view

A view is a type, in `domain/views/`. It may hold identifiers and value objects, and any shape the
reader needs.

```ts [src/ordering/domain/views/order-summary.view.ts]
import type { View } from "@alveolus/core";

import type { Money } from "../value-objects/money.value-object";
import type { OrderId } from "../value-objects/order-id.identifier";

export type OrderSummary = View<{
	id: OrderId;
	total: Money;
	lineCount: number;
	placedAt: Date | null;
}>;
```

### Read it

A query repository returns the view; its adapter builds it straight from storage, without loading
the aggregate.

```ts [src/ordering/driven/pg/adapters/pg-order-summaries.adapter.ts]
export class PgOrderSummaries extends OrderSummaries {
	async summaryOf(id: OrderId): Promise<OrderSummary | undefined> {
		const row = await this.db.selectFrom("orders").where("id", "=", id.value).selectAll().executeTakeFirst();
		if (row === undefined) {
			return undefined;
		}
		return { id: new OrderId(row.id), lineCount: row.line_count, placedAt: row.placed_at, total: Money.of(row.total) };
	}
}
```

### Return it from a query

```ts [src/ordering/application/queries/get-order-summary.query.ts]
async handle({ orderId }: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
	const summary = await this.summaries.summaryOf(new OrderId(orderId));
	return summary === undefined ? err(new OrderNotFound({ orderId })) : ok(summary);
}
```

The driving adapter that answers the request turns the view into its response, or into a
[representation](../strategic/published-language.md) for another context.

### Keep the aggregate out of views

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/views/order-details.view.ts]
export type OrderDetails = View<{ order: Order; customerName: string }>;
```

```ts [✅ Prefer: src/ordering/domain/views/order-details.view.ts]
export type OrderDetails = View<{ id: OrderId; total: Money; customerName: string }>;
```

</div>

::: details Why?
A view that carries the aggregate hands its business methods to the read side: a query could then
change it. A view only carries data, so reading can never write.
:::

## Reference

```ts
type View<Props extends object> = Readonly<Props>;
```

| Type parameter | Description |
| --- | --- |
| `Props` | The fields of the view. |

**Caveats**

- `View` changes nothing at runtime: it is the read-only type it wraps. It marks the type as an
  answer of a query, for you and for your reviewers.
- `Readonly` is shallow: nested arrays and objects stay mutable unless you declare them `readonly`.
- No separate read model is implied: views are read from the same storage as the aggregates. CQRS
  with separate stores is out of scope.

Import from `@alveolus/core` or `@alveolus/core/views`.

## See also

- [Repositories](./repositories.md), the query repository that returns a view
- [Query handlers](../application/query-handlers.md), which return views
- [Published Language](../strategic/published-language.md), when a view leaves the context
