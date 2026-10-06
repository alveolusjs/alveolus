# Unit of Work

A unit of work runs the writes of one use case in one transaction: all of them are kept, or none.

<dl class="al-glance">
	<dt>Layer</dt><dd>Application (a port)</dd>
	<dt>File</dt><dd><code>shared-kernel/driven/pg/adapters/pg-unit-of-work.adapter.ts</code> (your adapter)</dd>
	<dt>Extends</dt><dd><a href="#api"><code>UnitOfWork</code></a></dd>
	<dt>Called by</dt><dd><a href="/core/application/command-handlers">Command handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/layers/no-portless-adapter"><code>layers/no-portless-adapter</code></a>, <a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></dd>
</dl>

## Why

Placing an order writes twice: the `Order` is saved, then its `OrderPlaced` event is added to the
[outbox](./outbox.md). If the process stops between the two, the order is placed and nobody hears
about it. If the second write fails, the first one stays.

::: tip The fix
The command handler runs its work inside `unitOfWork.run(…)`. Every write made inside belongs to the
same transaction. The work returns a [`Result`](../utilities/result.md): `ok` commits, `err` rolls
back.
:::

## How it works

`run` opens a transaction, runs the work, and reads its outcome:

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><code>ok</code>: commit</span>The writes are kept, and the result is returned.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><code>err</code>: roll back</span>A business failure, such as <code>EmptyOrder</code>. Nothing is kept, and the same <code>err</code> is returned.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Thrown: roll back</span>A bug or a lost connection. Nothing is kept, and the error is thrown again.</div>
</div>

```ts
return this.unitOfWork.run(async () => {
	await this.orders.save(order);
	await this.outbox.add(events);
	return ok();
});
```

The unit of work tracks nothing: it does not know which aggregates were loaded. The handler saves
each change explicitly, inside `run`.

## Where it fits

The unit of work wraps the whole PlaceOrder use case: loading the order, placing it, saving it and
adding its events to the outbox.

<div class="al-diagram">
<svg viewBox="0 0 680 320" role="img" aria-label="A request goes from a controller to the PlaceOrderHandler. One unit of work wraps its four steps: load the Order, call order.place, save the order and add its events to the outbox. It commits on ok and rolls back otherwise.">
	<defs>
		<marker id="uow-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="426" y="8" width="252" height="304" rx="12" />
	<text class="note" x="552" y="28" text-anchor="middle">unitOfWork.run(…) · this page</text>
	<rect class="box" x="8" y="132" width="130" height="56" rx="8" />
	<text class="label" x="73" y="156" text-anchor="middle">Controller</text>
	<text class="note" x="73" y="176" text-anchor="middle">driving adapter</text>
	<path class="link" d="M 138 160 L 178 160" marker-end="url(#uow-flow-arrow)" />
	<rect class="box" x="180" y="132" width="180" height="56" rx="8" />
	<text class="label" x="270" y="156" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="270" y="176" text-anchor="middle">command handler</text>
	<rect class="box" x="440" y="40" width="224" height="48" rx="8" />
	<text class="label" x="552" y="60" text-anchor="middle">1 · orders.findById(id)</text>
	<text class="note" x="552" y="78" text-anchor="middle">loads the Order</text>
	<rect class="box" x="440" y="102" width="224" height="48" rx="8" />
	<text class="label" x="552" y="122" text-anchor="middle">2 · order.place(…)</text>
	<text class="note" x="552" y="140" text-anchor="middle">rules + event</text>
	<rect class="box" x="440" y="164" width="224" height="48" rx="8" />
	<text class="label" x="552" y="184" text-anchor="middle">3 · orders.save(order)</text>
	<text class="note" x="552" y="202" text-anchor="middle">same transaction</text>
	<rect class="box" x="440" y="226" width="224" height="48" rx="8" />
	<text class="label" x="552" y="246" text-anchor="middle">4 · outbox.add(events)</text>
	<text class="note" x="552" y="264" text-anchor="middle">same transaction</text>
	<text class="note" x="552" y="298" text-anchor="middle">ok → commit · err → rollback</text>
	<path class="link" d="M 360 160 L 424 160" marker-end="url(#uow-flow-arrow)" />
</svg>
</div>

::: tip
One transaction per use case. A command handler never calls another one: two nested `run` calls
open two transactions.
:::

## API

```ts
import { Transaction, UnitOfWork } from "@alveolus/core";
// or: from "@alveolus/core/unit-of-work"
```

### Type parameters

```ts
abstract class UnitOfWork extends Port {
	run<T, E>(
		work: () => Promise<Result<T, E>>,
	): Promise<Result<T, E>>;
}
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `T` | The value of a success. | inferred from `work` |
| `E` | The error of a failure. | inferred from `work` |

### `begin()` <Badge type="info" text="protected · abstract" /> <Badge type="tip" text="you implement it" />

```ts
protected abstract begin(): Promise<Transaction>
```

Opens a transaction and returns it. `run` calls it once per call.

### `Transaction.commit()` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" />

```ts
abstract commit(): Promise<void>
```

Makes the writes of the transaction permanent.

### `Transaction.rollback()` <Badge type="info" text="abstract" /> <Badge type="tip" text="you implement it" />

```ts
abstract rollback(): Promise<void>
```

Discards the writes of the transaction.

### `run(work)` <Badge type="tip" text="called by the command handler" />

```ts
run<T, E>(
	work: () => Promise<Result<T, E>>,
): Promise<Result<T, E>>
```

Begins a transaction and runs `work`. Commits when it returns `ok`, rolls back when it returns
`err`, and rolls back then throws again when it throws.

::: warning Caveats
- The unit of work tracks nothing: the handler saves each aggregate explicitly inside `run`.
- A failure to commit is technical: it is thrown.
- Nested calls to `run` open nested transactions through `begin`. Avoid calling a command handler
  from another one.
:::

## Usage

Build a unit of work in PostgreSQL. Each step shows the whole file: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-choose-how-to-share-the-connection">Choose how to share the connection</a></span>One connection per transaction.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-declare-the-adapter">Declare the adapter</a></span>Extend the port.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-open-a-transaction">Open a transaction</a></span>Begin, then commit or roll back.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-share-the-connection">Share the connection</a></span>Repositories and outbox write in it.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-release-the-connection">Release the connection</a></span>Give it back to the pool.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">6</span><a href="#_6-wire-it-and-run-in-it">Wire it and run in it</a></span>Same storage everywhere.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">7</span><a href="#_7-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Choose how to share the connection

The repositories and the outbox must write on the connection of the transaction without receiving it: an `AsyncLocalStorage`, created once by the composition root, carries it.

### 2. Declare the adapter

The adapter extends `UnitOfWork` and receives the pool and the storage of the current connection. `run` is already written: you only open the transaction.

```ts [src/shared-kernel/driven/pg/adapters/pg-unit-of-work.adapter.ts]
import type { AsyncLocalStorage } from "node:async_hooks";

import { UnitOfWork } from "@alveolus/core";
import type { Pool, PoolClient } from "pg";

export class PgUnitOfWork extends UnitOfWork {
	constructor(
		private readonly pool: Pool,
		private readonly current: AsyncLocalStorage<PoolClient>,
	) {
		super();
	}
}
```

TypeScript now asks for `begin()`: the next step adds it.

### 3. Open a transaction

`begin` opens a transaction on a connection of the pool and returns how to end it. `Transaction` has no state of its own, so a plain object is enough: no second class.

```ts [src/shared-kernel/driven/pg/adapters/pg-unit-of-work.adapter.ts]
import type { AsyncLocalStorage } from "node:async_hooks";

import { UnitOfWork } from "@alveolus/core"; // [!code --]
import { type Transaction, UnitOfWork } from "@alveolus/core"; // [!code ++]
import type { Pool, PoolClient } from "pg";

export class PgUnitOfWork extends UnitOfWork {
	constructor(
		private readonly pool: Pool,
		private readonly current: AsyncLocalStorage<PoolClient>,
	) {
		super();
	}

	protected async begin(): Promise<Transaction> { // [!code ++]
		const client = await this.pool.connect(); // [!code ++]
		await client.query("BEGIN"); // [!code ++]
		return { // [!code ++]
			commit: async () => { // [!code ++]
				await client.query("COMMIT"); // [!code ++]
			}, // [!code ++]
			rollback: async () => { // [!code ++]
				await client.query("ROLLBACK"); // [!code ++]
			}, // [!code ++]
		}; // [!code ++]
	} // [!code ++]
}
```

### 4. Share the connection

So that every adapter called inside `run` writes in the same transaction, `begin` puts the connection in the storage they read.

```ts [src/shared-kernel/driven/pg/adapters/pg-unit-of-work.adapter.ts]
import type { AsyncLocalStorage } from "node:async_hooks";

import { type Transaction, UnitOfWork } from "@alveolus/core";
import type { Pool, PoolClient } from "pg";

export class PgUnitOfWork extends UnitOfWork {
	constructor(
		private readonly pool: Pool,
		private readonly current: AsyncLocalStorage<PoolClient>,
	) {
		super();
	}

	protected async begin(): Promise<Transaction> {
		const client = await this.pool.connect();
		await client.query("BEGIN");
		this.current.enterWith(client); // [!code ++]
		return {
			commit: async () => {
				await client.query("COMMIT");
			},
			rollback: async () => {
				await client.query("ROLLBACK");
			},
		};
	}
}
```

### 5. Release the connection

A connection that is never released exhausts the pool. Each way out of the transaction gives it back.

```ts [src/shared-kernel/driven/pg/adapters/pg-unit-of-work.adapter.ts]
import type { AsyncLocalStorage } from "node:async_hooks";

import { type Transaction, UnitOfWork } from "@alveolus/core";
import type { Pool, PoolClient } from "pg";

export class PgUnitOfWork extends UnitOfWork {
	constructor(
		private readonly pool: Pool,
		private readonly current: AsyncLocalStorage<PoolClient>,
	) {
		super();
	}

	protected async begin(): Promise<Transaction> {
		const client = await this.pool.connect();
		await client.query("BEGIN");
		this.current.enterWith(client);
		return {
			commit: async () => {
				await client.query("COMMIT");
				client.release(); // [!code ++]
			},
			rollback: async () => {
				await client.query("ROLLBACK");
				client.release(); // [!code ++]
			},
		};
	}
}
```

This is the complete unit of work.

### 6. Wire it and run in it

The composition root passes the same storage to the unit of work and to every adapter that writes in it:

```ts [src/app.module.ts]
const current = new AsyncLocalStorage<PoolClient>();
const unitOfWork = new PgUnitOfWork(pool, current);
const outbox = new PgOutbox(pool, current);
```

The [command handler](./command-handlers.md#usage) then wraps its work in `run`: a returned failure or a thrown error rolls everything back.

```ts [src/ordering/application/commands/place-order.command.ts]
return this.unitOfWork.run(async () => {
	const order = await this.orders.findById(new OrderId(orderId));
	…
	await this.orders.save(order);
	await this.outbox.add(events);
	return ok();
});
```

### 7. Check it

Run the checks. Two rules keep the unit of work the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/layers/no-portless-adapter"><code>no-portless-adapter</code></a></span>It extends the port it implements.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in its file: no second class for the transaction.</div>
</div>

A transaction class declared in the same file is reported:

```
src/shared-kernel/driven/pg/adapters/pg-unit-of-work.adapter.ts:30
  tactical/no-misplaced-class: PgTransaction shares its file
  with PgUnitOfWork: one class per file.
```

## See also

- [Outbox](./outbox.md), written in the same transaction
- [Command handlers](./command-handlers.md), which run their work in it
- [Repositories](../domain/repositories.md), which write through it
- [Result](../utilities/result.md), whose outcome decides commit or rollback
- Rules: [`layers/no-portless-adapter`](../../rules/layers/no-portless-adapter.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
