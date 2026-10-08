---
description: "The Result type in TypeScript: the outcome of an operation that can fail for a business reason, ok with a value or err with a domain error."
---

# Result

A `Result` is the outcome of an operation that can fail for a business reason: `ok` with a value,
or `err` with a [domain error](../domain/domain-errors.md).

<dl class="al-glance">
	<dt>Layer</dt><dd>Every layer</dd>
	<dt>Type</dt><dd><a href="#api"><code>Result&lt;T, E&gt; = Ok&lt;T&gt; | Err&lt;E&gt;</code></a></dd>
	<dt>Returned by</dt><dd><a href="/core/domain/aggregates">Aggregates</a>, <a href="/core/domain/entities">entities</a>, <a href="/core/domain/value-objects">value object</a> factories, <a href="/core/domain/domain-services">domain services</a>, <a href="/core/application/command-handlers">command handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-thrown-failure"><code>tactical/no-thrown-failure</code></a></dd>
</dl>

## Why

`order.place()` can fail: the order is already placed, or it has no line. If it throws, nothing in
its signature says so. The handler forgets the `try`, the controller answers 500 instead of 422,
and the client never learns why.

::: tip The fix
`place` returns `Result<void, OrderAlreadyPlaced | EmptyOrder>`. The failures are part of the type:
TypeScript makes every caller look at them, and each one passes them on or turns them into a
response.
:::

## How it works

A `Result` is a plain object, not a class. Two functions build it, and its `ok` flag tells them
apart.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Build it</span><code>ok(value)</code> for a success, <code>ok()</code> when there is no value, <code>err(error)</code> for a failure.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Check it</span>After <code>if (!result.ok)</code>, TypeScript knows <code>result.error</code>. After it, <code>result.value</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Pass it on</span>Return the failure as is: its type joins the error union of the caller.</div>
</div>

```ts
place(
	eventId: string,
	now: Date,
): Result<void, OrderAlreadyPlaced | EmptyOrder> {
	if (this.isPlaced) {
		return err(new OrderAlreadyPlaced());
	}
	if (this.lines.length === 0) {
		return err(new EmptyOrder());
	}
	// … change the state and record OrderPlaced
	return ok();
}
```

## Where it fits

A failure travels as a value from the aggregate to the edge, where a driving adapter turns it into
a response.

<div class="al-diagram">
<svg viewBox="0 0 680 372" role="img" aria-label="Order.place returns err(EmptyOrder). The PlaceOrderHandler returns the same err. The OrdersController maps it to an HTTP 422 response that names the error.">
	<defs>
		<marker id="result-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="box" x="40" y="16" width="260" height="52" rx="8" />
	<text class="label" x="170" y="38" text-anchor="middle">order.place(…)</text>
	<text class="note" x="170" y="56" text-anchor="middle">aggregate: checks the rules</text>
	<path class="link" d="M 170 68 L 170 110" marker-end="url(#result-flow-arrow)" />
	<rect class="boundary" x="196" y="76" width="200" height="28" rx="8" />
	<text class="note" x="296" y="95" text-anchor="middle">err(EmptyOrder)</text>
	<rect class="box" x="40" y="112" width="260" height="52" rx="8" />
	<text class="label" x="170" y="134" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="170" y="152" text-anchor="middle">returns the failure as is</text>
	<path class="link" d="M 170 164 L 170 206" marker-end="url(#result-flow-arrow)" />
	<rect class="boundary" x="196" y="172" width="200" height="28" rx="8" />
	<text class="note" x="296" y="191" text-anchor="middle">the same err</text>
	<rect class="box" x="40" y="208" width="260" height="52" rx="8" />
	<text class="label" x="170" y="230" text-anchor="middle">OrdersController</text>
	<text class="note" x="170" y="248" text-anchor="middle">driving adapter: maps it</text>
	<path class="link" d="M 170 260 L 170 302" marker-end="url(#result-flow-arrow)" />
	<text class="note" x="196" y="287">422 { error: "EmptyOrder" }</text>
	<rect class="box" x="40" y="304" width="260" height="52" rx="8" />
	<text class="label" x="170" y="326" text-anchor="middle">HTTP response</text>
	<text class="note" x="170" y="344" text-anchor="middle">the client sees why</text>
</svg>
</div>

::: tip
Nobody in between wraps, logs or rethrows the failure. Only the edge decides what it becomes.
:::

## API

```ts
import {
	andThen,
	combine,
	err,
	map,
	mapErr,
	ok,
	type Result,
} from "@alveolus/core";
// or: import { … } from "@alveolus/core/result";
```

### Type parameters

```ts
type Result<T, E> = Ok<T> | Err<E>;
```

| Parameter | What it is |
| --- | --- |
| `T` | The value of a success. `void` when there is none. |
| `E` | The error of a failure: usually a union of domain errors. |

### `ok()` <Badge type="tip" text="returned on a success" />

```ts
function ok(): Ok<void>;
function ok<T>(value: T): Ok<T>;
```

Builds a success. Without an argument, it carries no value: `ok()` is a `Result<void, E>`.

### `err(error)` <Badge type="tip" text="returned on a failure" />

```ts
function err<E>(error: E): Err<E>;
```

Builds a failure that carries `error`, usually a [domain error](../domain/domain-errors.md).

### `result.ok` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by the caller" />

```ts
readonly ok: true; // on Ok<T>
readonly ok: false; // on Err<E>
```

`true` on a success, `false` on a failure. Checking it narrows the type to `Ok<T>` or `Err<E>`.

### `result.value` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by the caller" />

```ts
readonly value: T; // on Ok<T>
```

The value of a success. It exists only after checking `result.ok`.

### `result.error` <Badge type="info" text="readonly" /> <Badge type="tip" text="read by the caller" />

```ts
readonly error: E; // on Err<E>
```

The error of a failure. It exists only after checking `!result.ok`.

### `map(result, transform)` <Badge type="tip" text="to combine results" />

```ts
function map<T, E, U>(
	result: Result<T, E>,
	transform: (value: T) => U,
): Result<U, E>;
```

Transforms the value of a success. A failure passes through unchanged.

### `mapErr(result, transform)` <Badge type="tip" text="to combine results" />

```ts
function mapErr<T, E, F>(
	result: Result<T, E>,
	transform: (error: E) => F,
): Result<T, F>;
```

Transforms the error of a failure. A success passes through unchanged.

### `andThen(result, next)` <Badge type="tip" text="to combine results" />

```ts
function andThen<T, E, U, F>(
	result: Result<T, E>,
	next: (value: T) => Result<U, F>,
): Result<U, E | F>;
```

Runs `next` on the value of a success and returns its result. A failure passes through, and the
errors of `next` add to the union.

### `combine(results)` <Badge type="tip" text="to combine results" />

```ts
function combine<
	const Results extends
		| readonly AnyResult[]
		| Readonly<Record<string, AnyResult>>,
>(
	results: Results,
): Result<CombinedValues<Results>, CombinedErrors<Results>>;
```

Takes an array or an object of results. Returns all the values in the same shape, or the first
failure in order. The error type is the union of the errors of every result.

::: warning Caveats
- `Result` is a discriminated union, not a class: there are no methods, and narrowing on `ok`
  works as for any union.
- `combine` stops at the first failure in order: it does not collect every error.
- A `Result` carries expected failures. Technical failures, such as a lost connection, are thrown
  by adapters and handled like any other exception; the domain and the application never throw.
:::

## Usage

Build the command handler that places an order, one idea at a time. Each step shows the whole file:
added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-start-from-a-method-that-can-fail">Start from a method that can fail</a></span>The domain already returns a Result.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-return-success-and-failure">Return success and failure</a></span>ok for success, err for failure.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-pass-a-failure-on-as-is">Pass a failure on as is</a></span>Narrow on ok, return the rest.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-combine-several-results">Combine several results</a></span>One check for many values.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-turn-it-into-a-response">Turn it into a response</a></span>Only the edge knows the transport.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Start from a method that can fail

`Order.place` returns `Result<void, OrderAlreadyPlaced | EmptyOrder>`: see the
[aggregate](../domain/aggregates.md). The handler that calls it builds on the same type.

### 2. Return success and failure

So that the caller sees in the signature what can go wrong, the handler declares its error union
and returns a `Result`: `err` when the order does not exist, `ok()` when all went well. Nothing
is thrown.

```ts [src/ordering/application/commands/place-order.command.ts]
import {
	CommandHandler,
	err,
	ok,
	type Result,
} from "@alveolus/core";

import { OrderNotFound } from
	"../../domain/errors/order-not-found.error";
import { Orders } from "../../domain/repositories/orders.repository";
import { OrderId } from
	"../../domain/value-objects/order-id.identifier";

export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError = OrderNotFound;

export class PlaceOrderHandler extends CommandHandler<
	PlaceOrder,
	void,
	PlaceOrderError
> {
	constructor(private readonly orders: Orders) {
		super();
	}

	async handle({
		orderId,
	}: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		return ok();
	}
}
```

### 3. Pass a failure on as is

When `place` fails, the handler has nothing to add: it returns the failed `Result` as is, after
checking `ok`. Its errors join the union of the handler, so the caller still sees every one.

```ts [src/ordering/application/commands/place-order.command.ts]
import {
	Clock, // [!code ++]
	CommandHandler,
	err,
	IdGenerator, // [!code ++]
	ok,
	type Result,
} from "@alveolus/core";

import { EmptyOrder } from "../../domain/errors/empty-order.error"; // [!code ++]
import { OrderAlreadyPlaced } from // [!code ++]
	"../../domain/errors/order-already-placed.error"; // [!code ++]
import { OrderNotFound } from
	"../../domain/errors/order-not-found.error";
import { Orders } from "../../domain/repositories/orders.repository";
import { OrderId } from
	"../../domain/value-objects/order-id.identifier";

export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError = OrderNotFound; // [!code --]
export type PlaceOrderError = // [!code ++]
	| OrderNotFound // [!code ++]
	| OrderAlreadyPlaced // [!code ++]
	| EmptyOrder; // [!code ++]

export class PlaceOrderHandler extends CommandHandler<
	PlaceOrder,
	void,
	PlaceOrderError
> {
	constructor(private readonly orders: Orders) { // [!code --]
	constructor( // [!code ++]
		private readonly orders: Orders, // [!code ++]
		private readonly clock: Clock, // [!code ++]
		private readonly ids: IdGenerator, // [!code ++]
	) { // [!code ++]
		super();
	}

	async handle({
		orderId,
	}: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place(this.ids.next(), this.clock.now()); // [!code ++]
		if (!placed.ok) { // [!code ++]
			return placed; // [!code ++]
		} // [!code ++]
		await this.orders.save(order); // [!code ++]
		return ok();
	}
}
```

### 4. Combine several results

When a use case needs several results, `combine` takes an array or an object of them and returns
all the values, or the first failure. `map`, `mapErr` and `andThen` transform or chain a single
one: see the [API](#api).

```ts
const prices = combine({
	unit: Money.of(input.unitPrice, currency),
	shipping: Money.of(input.shipping, currency),
});
if (!prices.ok) {
	return prices;
}
const total = prices.value.unit.add(prices.value.shipping);
```

### 5. Turn it into a response

A driving adapter turns the failure into what its transport expects. Domain errors become HTTP
errors there, and nowhere else.

```ts [src/ordering/driving/http/controllers/orders.controller.ts]
const placed = await this.placeOrder.handle({ orderId });
if (!placed.ok) {
	return {
		status: 422,
		body: {
			error: placed.error.type,
			details: placed.error.payload,
		},
	};
}
return { status: 204 };
```

### 6. Check it

Run the checks. One rule keeps business failures as values:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-thrown-failure"><code>tactical/no-thrown-failure</code></a></span>Public methods of aggregates and entities return a <code>Result</code>, and nothing is thrown in the domain or the application.</div>
</div>

A failure thrown instead of returned is reported:

```
src/ordering/domain/aggregates/order.aggregate.ts
  58  tactical/no-thrown-failure: A failure is thrown: return it in a
  Result instead.
```

## See also

- [Domain errors](../domain/domain-errors.md), what a failure carries
- [Aggregates](../domain/aggregates.md) and [Command handlers](../application/command-handlers.md),
  which return results
- [Unit of Work](../application/unit-of-work.md), which commits on `ok` and rolls back on `err`
- Rules: [`tactical/no-thrown-failure`](../../rules/tactical/no-thrown-failure.md)
