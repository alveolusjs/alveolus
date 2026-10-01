# Views

A view is a business read model: what a query returns, shaped for reading rather than for changing
the model. It is plain JSON declared in the domain, and a view repository reads it.

```ts
export type OrderSummary = { id: string; status: OrderStatus; total: number };

export interface OrderSummaryRepository extends ViewRepository<OrderSummary> {
	findById(orderId: string): Promise<OrderSummary | undefined>;
}
```

## When to use

Declare a view when a [query handler](../application/query-handlers.md) needs data shaped for a
screen or an API: a summary, a list, figures computed over several aggregates. Showing the business
is still business, so views live in the domain. To change state, load the
[aggregate](./aggregates.md) through its [repository](./repositories.md) instead.

## Usage

### Declare a view

One type per view, in `domain/views/`, with a `type` alias: plain JSON only, like a
[snapshot](./aggregates.md#export-and-restore-a-snapshot).

```ts [src/ordering/domain/views/order-summary.view.ts]
import type { OrderStatus } from "../aggregates/order.aggregate.ts";

export type OrderSummary = {
	id: string;
	customerId: string;
	status: OrderStatus;
	total: number;
	lineCount: number;
};
```

### Declare its repository

Extend `ViewRepository` with the view type and the reads your queries need, in
`domain/repositories/`, next to the repositories of aggregates.

```ts [src/ordering/domain/repositories/order-summary.repository.ts]
import type { ViewRepository } from "@alveolus/core";
import type { OrderSummary } from "../views/order-summary.view.ts";

export interface OrderSummaryRepository extends ViewRepository<OrderSummary> {
	findById(orderId: string): Promise<OrderSummary | undefined>;
	findByCustomer(customerId: string): Promise<OrderSummary[]>;
}
```

### Implement it

The adapter lives in `driven/`. It reads the view directly with the query that suits the storage,
without loading aggregates.

```ts [src/ordering/driven/pg-order-summary-repository.ts]
export class PgOrderSummaryRepository implements OrderSummaryRepository {
	async findById(orderId: string): Promise<OrderSummary | undefined> {
		const { rows } = await this.db.query("SELECT * FROM order_summaries WHERE id = $1", [orderId]);
		return rows[0];
	}

	// findByCustomer…
}
```

## Reference

```ts
interface ViewRepository<View extends JsonValue>
```

| Type parameter | Description                        |
| -------------- | ---------------------------------- |
| `View`         | The JSON type the repository reads. |

`ViewRepository` has no member: it marks the interface as the repository of a view, so that
`alveolus arch check` finds it, its view and its adapters.

**Caveats**

- Declare a view with a `type` alias or inline. TypeScript does not consider an `interface` as
  JSON, and a `Date`, an identifier or a value object in a view does not compile.

Import from `@alveolus/core` or `@alveolus/core/views`.

## See also

- [Query handlers](../application/query-handlers.md), which return views
- [Repositories](./repositories.md), for aggregates
- [Project layout](/arch/project-layout), the `view/*` and `view-repository/*` rules
