---
description: "Architecture rule for query handlers: a query reads views and never receives a command repository, an outbox, a unit of work or an event publisher."
---

# no-command-in-query

A query reads views: it never receives what writes.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-command-in-query</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A query handler that receives a command repository, an outbox, a unit of work or an event publisher</dd>
	<dt>Applies to</dt><dd>The constructor parameters of every <code>QueryHandler</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-command-in-query": "off"</code></a></dd>
</dl>

## Why

`GetOrderSummaryHandler` receives the unit of work: a read can now change state, and the caller who
asked a question gets a side effect too.

::: tip The fix
A query reads a view through a query repository, and writes nothing. A query that seems to need a
write is a command, or a command followed by a query.
:::

## What it checks

The constructor parameters of each `QueryHandler`: none of them is a `CommandRepository`, an
`Outbox`, a `UnitOfWork` or an `EventPublisher`.

A parameter counts by what its type extends: `Orders` extends `CommandRepository<Order>`.

## What it reports

```
src/ordering/application/queries/get-order-summary.query.ts:3
  tactical/no-command-in-query: The QueryHandler
  GetOrderSummaryHandler receives UnitOfWork, a UnitOfWork: a query
  reads views and writes nothing.
```

## Fix it

### Read a view, and nothing else

So that a read never changes state, a [query handler](../../core/application/query-handlers.md)
receives only query repositories.

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
rules: { "tactical/no-command-in-query": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new queries keep to reading while you split the old ones.

## See also

- [Query handlers](../../core/application/query-handlers.md), what is checked
- [Repositories](../../core/domain/repositories.md) and [Views](../../core/domain/views.md), what
  each side reads
- [`tactical/no-query-in-command`](./no-query-in-command.md), the same separation from the command side
- [Rules](../index.md), every rule by category
