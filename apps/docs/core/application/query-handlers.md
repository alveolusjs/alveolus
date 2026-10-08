---
description: "Query handlers in CQRS with TypeScript: run one read that returns a view through a query repository, without loading aggregates or changing anything."
---

# Query handlers

A query handler runs one read: it returns a [view](../domain/views.md) read through a query
repository, without loading the aggregate and without changing anything.

<dl class="al-glance">
	<dt>Layer</dt><dd>Application</dd>
	<dt>File</dt><dd><code>application/queries/get-order-summary.query.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>QueryHandler&lt;Input, Output, Error&gt;</code></a></dd>
	<dt>Called by</dt><dd>Driving adapters: controllers, resolvers, scripts</dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a>, <a href="/rules/tactical/no-foreign-query-dependency"><code>tactical/no-foreign-query-dependency</code></a>, <a href="/rules/layers/no-outward-import"><code>layers/no-outward-import</code></a></dd>
</dl>

## Why

A screen lists the latest orders with their status and number of lines. Built from the `Order`
aggregate, it loads every order with all its lines, then asks the aggregate for getters it only
exposes for that screen. The aggregate grows to serve displays, and every read pays for rules it
never uses.

::: tip The fix
A query handler reads a view: a plain shape built for the reader, read straight from storage
through a query repository. The aggregate is not loaded, and nothing is saved or published.
:::

## How it works

A query handler receives a query, the data of one read, and returns a
[`Result`](../utilities/result.md):

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Read the view</span>Ask a <a href="/core/domain/repositories">query repository</a> for the view, in the shape the reader needs.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Handle what is missing</span>When nothing matches, return a <a href="/core/domain/domain-errors">domain error</a>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Return it</span>Return the view in a <code>Result</code>. Nothing else happens.</div>
</div>

```ts
async handle({
	orderId,
}: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
	const summary = await this.summaries.summaryOf(new OrderId(orderId));
	if (summary === undefined) {
		return err(new OrderNotFound({ orderId }));
	}
	return ok(summary);
}
```

## Where it fits

A query takes its own path through the system. The command side, with its aggregates, unit of
work and outbox, is never involved.

<div class="al-diagram">
<svg viewBox="0 0 680 150" role="img" aria-label="A controller calls the GetOrderSummaryHandler, which reads an OrderSummary view through the OrderSummaries query repository, which reads the storage.">
	<defs>
		<marker id="query-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="8" y="40" width="130" height="56" rx="8" />
	<text class="label" x="73" y="64" text-anchor="middle">Controller</text>
	<text class="note" x="73" y="84" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 68 L 164 68" marker-end="url(#query-flow-arrow)" />
	<rect class="boundary" x="166" y="40" width="190" height="56" rx="8" />
	<text class="label" x="261" y="64" text-anchor="middle">GetOrderSummaryHandler</text>
	<text class="note" x="261" y="84" text-anchor="middle">this page</text>
	<path class="link" d="M 356 68 L 382 68" marker-end="url(#query-flow-arrow)" />
	<rect class="box" x="384" y="40" width="160" height="56" rx="8" />
	<text class="label" x="464" y="64" text-anchor="middle">OrderSummaries</text>
	<text class="note" x="464" y="84" text-anchor="middle">query repository</text>
	<path class="link" d="M 544 68 L 570 68" marker-end="url(#query-flow-arrow)" />
	<rect class="box" x="572" y="40" width="100" height="56" rx="8" />
	<text class="label" x="622" y="64" text-anchor="middle">Storage</text>
	<text class="note" x="622" y="84" text-anchor="middle">tables</text>
	<text class="note" x="340" y="130" text-anchor="middle">returns OrderSummary, a view: no aggregate loaded</text>
</svg>
</div>

::: tip
A query handler only receives query repositories. It cannot change state, even by mistake.
:::

## API

```ts
import { QueryHandler } from "@alveolus/core";
// or: import { QueryHandler } from "@alveolus/core/query-handlers";
```

### Type parameters

```ts
abstract class QueryHandler<
	Input,
	Output,
	Error extends AnyDomainError = never,
> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Input` | The query: the data the handler needs. | any type |
| `Output` | What the read returns, usually a view or a list of views. | any type |
| `Error` | The union of the [domain errors](../domain/domain-errors.md) it may return. | extends `DomainError`; `never` by default |

### `constructor(…)` <Badge type="tip" text="you implement it" />

```ts
constructor(private readonly summaries: OrderSummaries) {
	super();
}
```

`QueryHandler` declares no constructor: yours takes the query repositories it reads and calls
`super()`.

### `handle(query)` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" /> <Badge type="tip" text="called by a driving adapter" />

```ts
abstract handle(query: Input): Promise<Result<Output, Error>>
```

Runs the read and returns its outcome. The driving adapter that calls it turns the `Result` into
a response.

::: warning Caveats
- There is no separate read model: views are read from the same storage, through a query
  repository.
- `Output` has no default, unlike `CommandHandler`: a read always returns something.
:::

## Usage

Build the handler that reads the summary of an order. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-prepare-the-view">Prepare the view</a></span>Know what the screen reads.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-query">Declare the query</a></span>Say what the caller provides.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-declare-the-handler">Declare the handler</a></span>One class, one question.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-return-a-missing-view-as-a-failure">Return a missing view as a failure</a></span>No undefined for callers to check.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-call-it-from-a-driving-adapter">Call it from a driving adapter</a></span>Turn the Result into a response.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Prepare the view

A query reads a [view](../domain/views.md), `OrderSummary`, through a query [repository](../domain/repositories.md), `OrderSummaries`: declare them first.

### 2. Declare the query

So that a driving adapter knows what to provide, the query is a plain type named after the question, in the file of its handler.

```ts [src/ordering/application/queries/get-order-summary.query.ts]
export interface GetOrderSummary {
	readonly orderId: string;
}
```

### 3. Declare the handler

The handler extends `QueryHandler` and receives the query repository as an abstract class. It reads the view and returns it, without loading an aggregate.

```ts [src/ordering/application/queries/get-order-summary.query.ts]
import { ok, QueryHandler, type Result } from "@alveolus/core"; // [!code ++]

import { // [!code ++]
	OrderSummaries, // [!code ++]
} from "../../domain/repositories/order-summaries.repository"; // [!code ++]
import { OrderId } from "../../domain/value-objects/order-id.identifier"; // [!code ++]
import type { OrderSummary } from "../../domain/views/order-summary.view"; // [!code ++]

export interface GetOrderSummary {
	readonly orderId: string;
}

export class GetOrderSummaryHandler extends QueryHandler< // [!code ++]
	GetOrderSummary, // [!code ++]
	OrderSummary | undefined // [!code ++]
> { // [!code ++]
	constructor(private readonly summaries: OrderSummaries) { // [!code ++]
		super(); // [!code ++]
	} // [!code ++]

	async handle({ // [!code ++]
		orderId, // [!code ++]
	}: GetOrderSummary): Promise< // [!code ++]
		Result<OrderSummary | undefined, never> // [!code ++]
	> { // [!code ++]
		return ok( // [!code ++]
			await this.summaries.summaryOf(new OrderId(orderId)), // [!code ++]
		); // [!code ++]
	} // [!code ++]
} // [!code ++]
```

### 4. Return a missing view as a failure

Returning `undefined` pushes the check to every caller, who may forget it. The handler declares `OrderNotFound` instead, so the signature says what can go wrong.

```ts [src/ordering/application/queries/get-order-summary.query.ts]
import { ok, QueryHandler, type Result } from "@alveolus/core"; // [!code --]
import { err, ok, QueryHandler, type Result } from "@alveolus/core"; // [!code ++]

import { OrderNotFound } from "../../domain/errors/order-not-found.error"; // [!code ++]
import {
	OrderSummaries,
} from "../../domain/repositories/order-summaries.repository";
import { OrderId } from "../../domain/value-objects/order-id.identifier";
import type { OrderSummary } from "../../domain/views/order-summary.view";

export interface GetOrderSummary {
	readonly orderId: string;
}

export class GetOrderSummaryHandler extends QueryHandler<
	GetOrderSummary,
	OrderSummary | undefined // [!code --]
	OrderSummary, // [!code ++]
	OrderNotFound // [!code ++]
> {
	constructor(private readonly summaries: OrderSummaries) {
		super();
	}

	async handle({
		orderId,
	}: GetOrderSummary): Promise< // [!code --]
		Result<OrderSummary | undefined, never> // [!code --]
	> { // [!code --]
		return ok( // [!code --]
			await this.summaries.summaryOf(new OrderId(orderId)), // [!code --]
	}: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> { // [!code ++]
		const summary = await this.summaries.summaryOf( // [!code ++]
			new OrderId(orderId), // [!code ++]
		);
		if (summary === undefined) { // [!code ++]
			return err(new OrderNotFound({ orderId })); // [!code ++]
		} // [!code ++]
		return ok(summary); // [!code ++]
	}
}
```

This is the complete handler.

### 5. Call it from a driving adapter

A controller builds the query, calls `handle` and turns the `Result` into a response: the failure becomes a 404 there, and nowhere else.

```ts [src/ordering/driving/http/controllers/orders.controller.ts]
const summary = await this.getOrderSummary.handle({ orderId });
if (!summary.ok) {
	return { status: 404, body: { error: summary.error.type } };
}
return { status: 200, body: summary.value };
```

### 6. Check it

Run the checks. Three rules keep the handler the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-foreign-query-dependency"><code>no-foreign-query-dependency</code></a></span>It receives query repositories, ports that do not write and value objects: a read never writes.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>application/queries/*.query.ts</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-outward-import"><code>no-outward-import</code></a></span>It imports the domain and the application, never an adapter.</div>
</div>

A command repository added to its constructor is reported:

```
src/ordering/application/queries/get-order-summary.query.ts
  20  error  tactical/no-foreign-query-dependency: The QueryHandler
  GetOrderSummaryHandler receives Orders, a CommandRepository: a
  query handler receives query repositories, ports that do not
  write, and value objects.
```

## See also

- [Views](../domain/views.md), what a query returns
- [Repositories](../domain/repositories.md), for `QueryRepository`
- [Command handlers](./command-handlers.md), for requests that change state
- Rules: [`tactical/no-foreign-query-dependency`](../../rules/tactical/no-foreign-query-dependency.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
