# Query handlers

A query handler is the application service of one use case that reads data without changing it. It
returns what the caller needs to display, in a [`Result`](../utilities/result.md).

```ts
export class GetOrderSummaryHandler implements QueryHandler<GetOrderSummary, OrderSummary, OrderNotFound> {
	async handle({ orderId }: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
		const summary = await this.summaries.findById(orderId);
		if (summary === undefined) {
			return err(new OrderNotFound({ id: orderId }));
		}
		return ok(summary);
	}
}
```

## When to use

Write one query handler per read: show an order, list the orders of a customer. A query never
saves an aggregate nor publishes events. For a request that changes state, write a
[command handler](./command-handlers.md).

## Usage

### Declare the query and its result

The query is the input of the handler, in `application/queries/`. What it returns is a view: a
business representation shaped for reading, declared as a plain type in `domain/views/`. Showing
the business is still business, so views belong to the domain model, next to the aggregates they
describe.

```ts [src/ordering/application/queries/get-order-summary.query.ts]
export type GetOrderSummary = {
	orderId: string;
};
```

```ts [src/ordering/domain/views/order-summary.view.ts]
export type OrderSummary = {
	id: string;
	total: number;
	status: OrderStatus;
};
```

### Read through a view repository

Reads do not have to load aggregates. Declare the [repository of the view](../domain/views.md) in `domain/repositories/`,
like the repositories of aggregates, and implement it in `driven/` with the query that suits your
storage: it returns the view directly.

```ts [src/ordering/domain/repositories/order-summary.repository.ts]
import type { ViewRepository } from "@alveolus/core";
import type { OrderSummary } from "../views/order-summary.view.ts";

export interface OrderSummaryRepository extends ViewRepository<OrderSummary> {
	findById(orderId: string): Promise<OrderSummary | undefined>;
}
```

```ts [src/ordering/application/queries/get-order-summary.query.ts]
import type { QueryHandler, Result } from "@alveolus/core";
import { err, ok } from "@alveolus/core";

export class GetOrderSummaryHandler implements QueryHandler<GetOrderSummary, OrderSummary, OrderNotFound> {
	constructor(private readonly summaries: OrderSummaryRepository) {}

	async handle({ orderId }: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
		// read and return the view
	}
}
```

### Build a view from an aggregate

When the view needs nothing more than the aggregate, load the aggregate and map its
[snapshot](../domain/aggregates.md#export-and-restore-a-snapshot) to the view.

```ts
const { id, status, lines } = order.toSnapshot();
return ok({ id, status, lineCount: lines.length });
```

### A read that cannot fail

Leave `Error` out: it defaults to `never`, and the result is always a success.

```ts
export class ListOrderSummariesHandler implements QueryHandler<ListOrderSummaries, readonly OrderSummary[]> {
	async handle({ customerId }: ListOrderSummaries): Promise<Result<readonly OrderSummary[], never>> {
		return ok(await this.summaries.findByCustomer(customerId));
	}
}
```

## Reference

```ts
interface QueryHandler<Input, Output, Error extends AnyDomainError = never>
```

| Type parameter | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| `Input`        | The query: the data the handler needs.                                    |
| `Output`       | What a success returns. Required.                                         |
| `Error`        | Union of the domain errors the handler can return. Defaults to `never`.  |

| Member          | Type                              | Description                          |
| --------------- | --------------------------------- | ------------------------------------ |
| `handle(query)` | `Promise<Result<Output, Error>>`  | Runs the read and returns its outcome. |

**Caveats**

- `CommandHandler` and `QueryHandler` have the same shape. The type system does not stop a query
  handler from changing state: name and review them by intent.
- `Error` only accepts `DomainError` subclasses.

Import from `@alveolus/core` or `@alveolus/core/query-handlers`.

## See also

- [Command handlers](./command-handlers.md), for requests that change state
- [Domain Errors](../domain/domain-errors.md), what a failed read returns
