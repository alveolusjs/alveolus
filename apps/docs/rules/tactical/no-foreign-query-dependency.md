---
description: "Architecture rule for query handlers: a query handler receives query repositories, ports that do not write and value objects, never what changes state."
---

# no-foreign-query-dependency

A query handler receives what reads: nothing that writes or changes state.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-foreign-query-dependency</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A query handler that receives a command repository, an outbox, a unit of work, an event publisher, a handler, a domain service, an event translator or a class that is no building block</dd>
	<dt>Applies to</dt><dd>The constructor parameters and fields of every <code>QueryHandler</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-foreign-query-dependency": "off"</code></a></dd>
</dl>

## Why

`GetOrderSummaryHandler` receives the unit of work: a read can now change state, and the caller who
asked a question gets a side effect too. A command handler or a domain service injected into it
does the same, one step removed.

::: tip The fix
A query reads a view through a query repository, and writes nothing. A query that seems to need a
write is a command, or a command followed by a query.
:::

## What it checks

Every constructor parameter and every field of each `QueryHandler`, followed into `Pick`,
generics and objects such as `deps: { … }`:

| Receives | Allowed |
| --- | --- |
| A `QueryRepository` | ✅ |
| A `Port` that does not write, such as `Clock` or your own ports | ✅ |
| A value object, an identifier, a plain value such as a `number` | ✅ |
| A class of a package listed in `applicationDependencies` | ✅ |
| A `CommandRepository`, an `Outbox`, a `UnitOfWork`, an `EventPublisher` | ❌ |
| A `CommandHandler`, a `QueryHandler`, a `DomainService`, an `EventTranslator` | ❌ |
| Any other class of the project | ❌ |

A parameter counts by what its type extends: `Orders` extends `CommandRepository<Order>`.

## What it reports

```
src/ordering/application/queries/get-order-summary.query.ts
  3  error  tactical/no-foreign-query-dependency: The QueryHandler
  GetOrderSummaryHandler receives UnitOfWork, a UnitOfWork: a query
  handler receives query repositories, ports that do not write, and
  value objects.
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

## Limits

::: warning What the rule cannot see
- A plain `Port` whose adapter writes: the rule sees a port, not what its adapter does. In review,
  a port with a verb such as `mark…`, `record…` or `save…` has no place in a query.
- An interface that a command repository happens to satisfy: an interface is no class, so the rule
  cannot tell what will be injected. Type dependencies with the port class itself.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-foreign-query-dependency": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new queries keep to reading while you split the old ones.

## See also

- [Query handlers](../../core/application/query-handlers.md), what is checked
- [Repositories](../../core/domain/repositories.md) and [Views](../../core/domain/views.md), what
  a query reads
- [`tactical/no-foreign-command-dependency`](./no-foreign-command-dependency.md), the same list for
  command handlers
- [Rules](../index.md), every rule by category
