---
description: "Architecture rule for CQRS: a command handler changes aggregates and a query handler reads views, each keeping to the repositories of its side."
---

# no-mixed-handler

A command changes aggregates, a query reads views: each handler keeps to the repositories of its
side.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-mixed-handler</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A command handler that receives a query repository, a query handler that receives what writes</dd>
	<dt>Applies to</dt><dd>The constructor parameters of every <code>CommandHandler</code> and <code>QueryHandler</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-mixed-handler": "off"</code></a></dd>
</dl>

## Why

`PlaceOrderHandler` checks the order summary to decide whether the order may be placed. The view is
shaped for reading: it may be denormalised, stale or partial, and it protects no rule. The other
way round, a query that receives the outbox can change state while it reads.

::: tip The fix
A command decides from the aggregate, which keeps the rules; a query reads a view, and writes
nothing. Keeping each side to its own repositories keeps both honest, without going as far as
separate read and write models.
:::

## What it checks

The constructor parameters of each handler:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><code>CommandHandler</code></span>Never receives a <code>QueryRepository</code>.</div>
<div class="al-card"><span class="al-card-title"><code>QueryHandler</code></span>Never receives a <code>CommandRepository</code>, an <code>Outbox</code>, a <code>UnitOfWork</code> or an <code>EventPublisher</code>.</div>
</div>

A parameter counts by what its type extends: `Orders` extends `CommandRepository<Order>`,
`OrderSummaries` extends `QueryRepository<OrderSummary>`.

## What it reports

```
src/ordering/application/commands/place-order.command.ts:2
  tactical/no-mixed-handler: The CommandHandler PlaceOrderHandler
  receives OrderSummaries, a QueryRepository: keep commands and
  queries apart.

src/ordering/application/queries/get-order-summary.query.ts:3
  tactical/no-mixed-handler: The QueryHandler GetOrderSummaryHandler
  receives UnitOfWork, a UnitOfWork: keep commands and queries apart.
```

## Fix it

### Decide from the aggregate in a command

So that the decision is taken by what keeps the rules, a command handler loads the aggregate
through its [command repository](../../core/domain/repositories.md) and lets it decide.

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

### Read a view in a query, and nothing else

So that a read never changes state, a [query handler](../../core/application/query-handlers.md)
receives only query repositories. A query that seems to need a write is a command, or a command
followed by a query.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/application/queries/get-order-summary.query.ts]
constructor(
	private readonly summaries: OrderSummaries,
	private readonly unitOfWork: UnitOfWork,
) {
	super();
}
```

```ts [✅ Prefer: src/ordering/application/queries/get-order-summary.query.ts]
constructor(private readonly summaries: OrderSummaries) {
	super();
}
```

</div>

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-mixed-handler": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new handlers keep to their side while you split the old ones.

## See also

- [Command handlers](../../core/application/command-handlers.md) and
  [Query handlers](../../core/application/query-handlers.md), the two sides
- [Repositories](../../core/domain/repositories.md) and [Views](../../core/domain/views.md), what
  each side reads
- [`tactical/no-misplaced-class`](./no-misplaced-class.md), for where handlers and repositories live
- [Rules](../index.md), every rule by category
