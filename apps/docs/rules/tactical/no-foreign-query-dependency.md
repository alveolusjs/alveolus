---
description: "Architecture rule for query handlers: a query handler receives query repositories, ports that do not write and value objects, never what changes state."
---

# no-foreign-query-dependency

A query handler receives what reads: nothing that writes or changes state.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-foreign-query-dependency</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A query handler that receives a command repository, an outbox, a unit of work, an event publisher, a handler, a domain service, an event translator or a class that is no building block</dd>
	<dt>Applies to</dt><dd>The constructor parameters and fields of every <code>QueryHandler</code> of a core bounded context or the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-foreign-query-dependency": "off"</code></a></dd>
</dl>

## Why

`GetOrderSummaryHandler` receives the unit of work: a read can now change state, and the caller who
asked a question gets a side effect too. A command handler injected into it does the same, one
step removed.

A domain service is different: it is pure, so injecting it changes nothing. What it changes is
where the business rule runs. `GetSafeguardingReconciliationHandler` receives
`SafeguardingReconciliation` and computes the reconciliation at each read: two readers at two
moments see two different results, nothing records which one was reported, and the rule now runs
on two paths, the command's and the query's, that drift apart. The read side delivers data shaped
for the reader; the domain's behaviour runs on the write side, once, and leaves a fact.

::: tip The fix
A query reads a view through a query repository, and writes nothing. A query that seems to need a
write is a command, or a command followed by a query. A query that seems to need a domain service
is reading a fact nobody recorded, or holding a calculation that belongs to a value object.
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

### Record the fact, then read it

So that a result the reader relies on exists once, with its date, a domain service runs in a
command handler that records its outcome, and the query reads the record. A reconciliation, a
regulatory figure, a score: when the reader asks "what was it", the answer is a fact to keep, not
a calculation to redo.

<div class="al-compare">

```ts [❌ Avoid: src/safeguarding/application/queries/get-reconciliation.query.ts]
constructor(
	private readonly balances: SafeguardingBalances,
	private readonly reconciliation: SafeguardingReconciliation,
) {
	super();
}

async handle(query: GetReconciliation): Promise<Result<ReconciliationView, NotFound>> {
	const balances = await this.balances.on(query.date);
	return ok(this.reconciliation.reconcile(balances));
}
```

```ts [✅ Prefer: src/safeguarding/application/commands/reconcile-safeguarding.command.ts]
constructor(
	private readonly accounts: SafeguardingAccounts,
	private readonly reconciliation: SafeguardingReconciliation,
	private readonly unitOfWork: UnitOfWork,
) {
	super();
}

async handle(command: ReconcileSafeguarding): Promise<Result<void, NotFound>> {
	const account = await this.accounts.of(command.accountId);
	account.reconcile(this.reconciliation.reconcile(account.balances()), command.at);
	await this.unitOfWork.commit();
	return ok();
}
```

</div>

The query handler then receives `Reconciliations`, a query repository, and returns the
reconciliation of the date asked. The aggregate records the outcome, so the domain service keeps
one caller.

### Move a calculation into a value object

So that a figure derived from the values of a view is computed where values are computed, the
calculation becomes a static factory of a [value object](../../core/domain/value-objects.md),
which a query may use: a projection, a conversion, a total. Nothing is recorded because nothing
happened.

<div class="al-compare">

```ts [❌ Avoid: src/safeguarding/application/queries/get-own-funds-requirement.query.ts]
constructor(
	private readonly figures: SafeguardingFigures,
	private readonly calculator: OwnFundsRequirementCalculator,
) {
	super();
}

async handle(query: GetOwnFundsRequirement): Promise<Result<OwnFundsRequirementView, NotFound>> {
	const figures = await this.figures.of(query.firmId);
	return ok({ amount: this.calculator.compute(figures) });
}
```

```ts [✅ Prefer: src/safeguarding/application/queries/get-own-funds-requirement.query.ts]
constructor(private readonly figures: SafeguardingFigures) {
	super();
}

async handle(query: GetOwnFundsRequirement): Promise<Result<OwnFundsRequirementView, NotFound>> {
	const figures = await this.figures.of(query.firmId);
	return ok({ amount: OwnFundsRequirement.of(figures).amount });
}
```

</div>

Which of the two? If the reader asks for the figure as it was declared or decided, record it. If
the reader asks what the figure would be from the values on the screen, calculate it.

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
- [Domain services](../../core/domain/domain-services.md), called by the command handler, and
  [value objects](../../core/domain/value-objects.md), the home of a calculation
- [`tactical/no-foreign-command-dependency`](./no-foreign-command-dependency.md), the same list for
  command handlers
- [Rules](../index.md), every rule by category
