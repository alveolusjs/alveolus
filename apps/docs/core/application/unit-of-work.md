# Unit of Work

A unit of work runs a piece of work in one transaction, and reads its outcome as a
[`Result`](../utilities/result.md): `ok` commits, `err` rolls back and is returned as is, a thrown
error rolls back and is thrown again. Command handlers use it to change an aggregate and record its
events atomically.

```ts
return this.unitOfWork.run(async () => {
	await this.orders.save(order);
	await this.outbox.add(events);
	return ok();
});
```

## When to use

Wrap every command that writes more than once: the aggregate and the outbox, or two rows of the same
aggregate. Keep one aggregate per transaction when you can; change the others through their events.

## Usage

### Run a command in a transaction

The work is an async function returning a `Result`. Everything the repositories and the outbox write
inside it belongs to the same transaction.

```ts [src/ordering/application/commands/place-order.command.ts]
async handle({ orderId, total }: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
	return this.unitOfWork.run(async () => {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place(total, this.ids.next(), this.clock.now());
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order);
		await this.outbox.add(order.pullDomainEvents().map((event) => this.translator.translate(event, { correlationId: orderId })));
		return ok();
	});
}
```

A business failure rolls back without an exception: the handler returns the same `err`.

### Implement it in a driven adapter

Extend `UnitOfWork` and implement `begin`, which opens a transaction and returns a `Transaction` with
`commit` and `rollback`. The repositories and the outbox must write through that transaction; with
NestJS, an `AsyncLocalStorage` (or `nestjs-cls`) is the usual way to share it without passing it
around.

```ts [src/shared-kernel/driven/pg/adapters/pg-unit-of-work.adapter.ts]
import { AsyncLocalStorage } from "node:async_hooks";

import { Transaction, UnitOfWork } from "@alveolus/core";
import type { Pool, PoolClient } from "pg";

class PgTransaction extends Transaction {
	constructor(private readonly client: PoolClient) {
		super();
	}

	async commit(): Promise<void> {
		await this.client.query("COMMIT");
		this.client.release();
	}

	async rollback(): Promise<void> {
		await this.client.query("ROLLBACK");
		this.client.release();
	}
}

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
		return new PgTransaction(client);
	}
}
```

The example keeps `PgTransaction` next to its unit of work for brevity; with the
[`placement`](../../rules/placement.md) rule, give it its own file.

### Register it

`UnitOfWork` is a port: register its adapter with the abstract class as token.

```ts [src/ordering/ordering.module.ts]
providers: [{ provide: UnitOfWork, useClass: PgUnitOfWork }]
```

## Reference

```ts
abstract class UnitOfWork extends Port {
	run<T, E>(work: () => Promise<Result<T, E>>): Promise<Result<T, E>>;
	protected abstract begin(): Promise<Transaction>;
}

abstract class Transaction {
	abstract commit(): Promise<void>;
	abstract rollback(): Promise<void>;
}
```

| Member | Type | Description |
| --- | --- | --- |
| `run(work)` | `Promise<Result<T, E>>` | Opens a transaction, runs the work, commits on `ok`, rolls back on `err` (returned) or on a throw (rethrown). |
| `begin()` | protected abstract, `Promise<Transaction>` | Opens a transaction. One per call to `run`. |
| `Transaction.commit()` | `Promise<void>` | Makes the writes permanent. |
| `Transaction.rollback()` | `Promise<void>` | Discards the writes. |

**Caveats**

- The unit of work tracks nothing: the handler saves each aggregate explicitly inside `run`.
- A failure to commit is technical: it is thrown.
- Nested calls to `run` open nested transactions through `begin`; avoid calling a command handler
  from another one.

Import from `@alveolus/core` or `@alveolus/core/unit-of-work`.

## See also

- [Outbox](./outbox.md), written in the same transaction
- [Command handlers](./command-handlers.md), which run their work in it
- [Repositories](../domain/repositories.md)
