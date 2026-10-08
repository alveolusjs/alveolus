---
description: "Architecture rule for command handlers: a command handler receives command repositories, ports, event translators, domain services and value objects, never a view or another handler."
---

# no-foreign-command-dependency

A command handler receives what changes aggregates and what they need: nothing that reads views,
and no other handler.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-foreign-command-dependency</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A command handler that receives a query repository, another handler or a class that is no building block</dd>
	<dt>Applies to</dt><dd>The constructor parameters and fields of every <code>CommandHandler</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-foreign-command-dependency": "off"</code></a></dd>
</dl>

## Why

`PlaceOrderHandler` checks the order summary to decide whether the order may be placed. The view is
shaped for reading: it may be denormalised, stale or partial, and it protects no rule. Injecting
`GetOrderSummaryHandler` instead changes nothing, and injecting `PayOrderHandler` hides a second
transaction inside the first one.

::: tip The fix
A command loads the aggregate and lets it decide. What a handler may receive is a short list:
everything else is reported, so a new way of reaching a view does not slip through.
:::

## What it checks

Every constructor parameter and every field of each `CommandHandler`, followed into `Pick`,
generics and objects such as `deps: { … }`:

| Receives | Allowed |
| --- | --- |
| A `CommandRepository` | ✅ |
| A `Port`: `Clock`, `IdGenerator`, `UnitOfWork`, `Outbox`, your own ports | ✅ |
| An `EventTranslator`, a `DomainService` | ✅ |
| A value object, an identifier, a plain value such as a `number` | ✅ |
| A class of a package listed in `applicationDependencies` | ✅ |
| A `QueryRepository`, even though it is a `Port` | ❌ |
| An `EventPublisher`, even though it is a `Port`: events leave through the outbox, and the relay publishes them | ❌ |
| A `CommandHandler` or a `QueryHandler` | ❌ |
| Any other class of the project | ❌ |

A parameter counts by what its type extends: `OrderSummaries` extends
`QueryRepository<OrderSummary>`.

## What it reports

```
src/ordering/application/commands/place-order.command.ts
  2  tactical/no-foreign-command-dependency: The CommandHandler
  PlaceOrderHandler receives OrderSummaries, a QueryRepository: a
  command handler receives command repositories, ports, event
  translators, domain services and value objects.
```

## Fix it

### Decide from the aggregate

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

### React to an event instead of calling another handler

So that each command stays one transaction, a handler never calls another one. When placing an
order must also do something else, the other handler reacts to the domain event, in its own
transaction.

## Limits

::: warning What the rule cannot see
- A plain `Port` whose adapter reads the views: the rule sees a port, not what its adapter does.
  In review, a port named like a read (`OrderStats`, `…Summary`) used by a command is a query in
  disguise.
- An interface that a query repository happens to satisfy: an interface is no class, so the rule
  cannot tell what will be injected. Type dependencies with the port class itself.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-foreign-command-dependency": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new commands keep to their list while you rework the old ones.

## See also

- [Command handlers](../../core/application/command-handlers.md), what is checked
- [Repositories](../../core/domain/repositories.md) and [Ports](../../core/domain/ports.md), what a
  command handler receives
- [`tactical/no-foreign-query-dependency`](./no-foreign-query-dependency.md), the same list for
  query handlers
- [Rules](../index.md), every rule by category
