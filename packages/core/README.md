# @alveolus/core

The building blocks of Domain-Driven Design for TypeScript: aggregates, entities, value objects,
identifiers, domain events, domain errors, ports, repositories, command and query handlers, the
unit of work, the outbox, and `Result`. No runtime dependency.

```sh
pnpm add @alveolus/core
```

```ts
import { AggregateRoot, err, ok, type Result } from "@alveolus/core";

export class Order extends AggregateRoot<OrderId, OrderPlaced, OrderSnapshot> {
	place(total: number, eventId: string, now: Date): Result<void, InvalidTotal> {
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt: now, payload: { total } }));
		return ok();
	}
}
```

Each class says what it is, and [`@alveolus/arch`](https://www.npmjs.com/package/@alveolus/arch)
checks that it stays where it belongs.

- [Documentation](https://alveolus.dev/)
- [Getting started](https://alveolus.dev/guide/getting-started)
- [Building blocks](https://alveolus.dev/core/)

Node.js 24 or later. MIT.
