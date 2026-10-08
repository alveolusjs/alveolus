---
description: "Architecture rule for command handlers: a command decides from the aggregate, never from a view read through a query repository."
---

# no-query-in-command

A command decides from the aggregate, which keeps the rules: it never reads a view.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-query-in-command</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A command handler that receives a query repository</dd>
	<dt>Applies to</dt><dd>The constructor parameters of every <code>CommandHandler</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-query-in-command": "off"</code></a></dd>
</dl>

## Why

`PlaceOrderHandler` checks the order summary to decide whether the order may be placed. The view is
shaped for reading: it may be denormalised, stale or partial, and it protects no rule.

::: tip The fix
A command loads the aggregate and lets it decide. Keeping commands to command repositories keeps
the decision where the rules are, without going as far as separate read and write models.
:::

## What it checks

The constructor parameters of each `CommandHandler`: none of them is a `QueryRepository`.

A parameter counts by what its type extends: `OrderSummaries` extends
`QueryRepository<OrderSummary>`.

## What it reports

```
src/ordering/application/commands/place-order.command.ts:2
  tactical/no-query-in-command: The CommandHandler PlaceOrderHandler
  receives OrderSummaries, a QueryRepository: decide from the
  aggregate, through a CommandRepository.
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

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-query-in-command": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new commands decide from aggregates while you rework the old ones.

## See also

- [Command handlers](../../core/application/command-handlers.md), what is checked
- [Repositories](../../core/domain/repositories.md) and [Views](../../core/domain/views.md), what
  each side reads
- [`tactical/no-command-in-query`](./no-command-in-query.md), the same separation from the query side
- [Rules](../index.md), every rule by category
