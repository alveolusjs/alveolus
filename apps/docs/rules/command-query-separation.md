# command-query-separation

A command changes aggregates, a query reads views. Each handler keeps to the repositories of its
side, so a read never writes and a write never decides on a view.

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

`Orders` extends `CommandRepository<Order>`; `OrderSummaries` extends `QueryRepository<OrderSummary>`.

## What it checks

The constructor parameters of each handler:

| Handler | Never receives |
| --- | --- |
| `CommandHandler` | A `QueryRepository`. |
| `QueryHandler` | A `CommandRepository`, an `Outbox`, a `UnitOfWork` or an `EventPublisher`. |

## Why

A view is shaped for reading: it may be denormalised, stale or partial. A command that decides from
a view decides from something that does not protect the rules; the aggregate does. A query that
receives a repository of aggregates or an outbox can change state while it reads. Keeping each side
to its own repositories keeps both honest, without going as far as separate read and write models.

## What it reports

```
src/ordering/application/commands/place-order.command.ts:2
  command-query-separation: The CommandHandler PlaceOrderHandler receives OrderSummaries, a QueryRepository: keep commands and queries apart.
```

## Turn it off

```ts
rules: { "command-query-separation": "off" }
```

## See also

- [`placement`](./placement.md), for where handlers and repositories live
