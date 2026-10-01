# Query handlers

A query handler is the application service of one read. It returns a [view](../domain/views.md)
read through a query repository, without loading the aggregate. It saves nothing and publishes
nothing.

```ts
export class GetOrderSummaryHandler extends QueryHandler<GetOrderSummary, OrderSummary, OrderNotFound> {
	async handle({ orderId }: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
		const summary = await this.summaries.summaryOf(new OrderId(orderId));
		return summary === undefined ? err(new OrderNotFound({ orderId })) : ok(summary);
	}
}
```

## When to use

Write one query handler per read a client needs: an order summary, a list of orders. A view has the
shape the reader wants, whatever the shape of the aggregate. Requests that change state go through a
[command handler](./command-handlers.md).

## Usage

### Declare the query and its handler

The query is a plain type named after the request, in the same file as its handler.

```ts [src/ordering/application/queries/get-order-summary.query.ts]
import { err, ok, QueryHandler, type Result } from "@alveolus/core";
import { Injectable } from "@nestjs/common";

import { OrderNotFound } from "../../domain/errors/order-not-found.error";
import { OrderSummaries } from "../../domain/repositories/order-summaries.repository";
import { OrderId } from "../../domain/value-objects/order-id.identifier";
import type { OrderSummary } from "../../domain/views/order-summary.view";

export interface GetOrderSummary {
	readonly orderId: string;
}

@Injectable()
export class GetOrderSummaryHandler extends QueryHandler<GetOrderSummary, OrderSummary, OrderNotFound> {
	constructor(private readonly summaries: OrderSummaries) {
		super();
	}

	async handle({ orderId }: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
		const summary = await this.summaries.summaryOf(new OrderId(orderId));
		return summary === undefined ? err(new OrderNotFound({ orderId })) : ok(summary);
	}
}
```

### Return a list

A query that cannot fail keeps the default `Error` of `never`.

```ts [src/ordering/application/queries/list-orders.query.ts]
@Injectable()
export class ListOrdersHandler extends QueryHandler<void, readonly OrderSummary[]> {
	constructor(private readonly summaries: OrderSummaries) {
		super();
	}

	async handle(): Promise<Result<readonly OrderSummary[], never>> {
		return ok(await this.summaries.all());
	}
}
```

### Keep to the query side

A query handler reads views through query repositories. It never receives a command repository, an
outbox, a unit of work or an event publisher: a read must not change anything.

<div class="al-compare">

```ts [❌ Avoid]
constructor(
	private readonly orders: Orders,
	private readonly unitOfWork: UnitOfWork,
) {
	super();
}
```

```ts [✅ Prefer]
constructor(private readonly summaries: OrderSummaries) {
	super();
}
```

</div>

Checked by [`command-query-separation`](../../rules/command-query-separation.md).

## Reference

```ts
abstract class QueryHandler<Input, Output, Error extends AnyDomainError = never> {
	abstract handle(query: Input): Promise<Result<Output, Error>>;
}
```

| Type parameter | Description |
| --- | --- |
| `Input` | The query: the data the handler needs. |
| `Output` | What the read returns, usually a view or a list of views. |
| `Error` | Union of the domain errors the handler may return. Defaults to `never`. |

| Member | Type | Description |
| --- | --- | --- |
| `handle(query)` | `Promise<Result<Output, Error>>` | Runs the read and returns its outcome. |

**Caveats**

- There is no separate read model: views are read from the same storage, through a query
  repository.
- Call `super()` in the constructor of your handler.

Import from `@alveolus/core` or `@alveolus/core/query-handlers`.

## See also

- [Views](../domain/views.md), what a query returns
- [Repositories](../domain/repositories.md), for `QueryRepository`
- [Command handlers](./command-handlers.md), for requests that change state
- [`command-query-separation`](../../rules/command-query-separation.md)
