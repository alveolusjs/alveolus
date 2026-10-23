# @alveolus/core

The building blocks of Domain-Driven Design for TypeScript: aggregates, entities, value objects,
identifiers, domain events, domain errors, ports, repositories, command and query handlers, the
unit of work, the outbox, and `Result`. No runtime dependency.

```sh
pnpm add @alveolus/core
```

A value object extends `ValueObject` and refuses an invalid value with a `Result`, not an exception:

```ts
import { DomainError, err, ok, type Result, ValueObject } from '@alveolus/core';

export class InvalidMoney extends DomainError<{ minor: bigint }> {}

export class Money extends ValueObject<{ minor: bigint; currency: string }> {
	static of(minor: bigint, currency: string): Result<Money, InvalidMoney> {
		if (minor < 0n) {
			return err(new InvalidMoney({ minor }));
		}

		return ok(new Money({ minor, currency }));
	}
}
```

Each class says what it is: an aggregate extends `AggregateRoot`, a value object `ValueObject`.

- [Documentation](https://alveolus.dev/)
- [Getting started](https://alveolus.dev/start/getting-started)
- [Source](https://github.com/alveolusjs/alveolus/tree/main/packages/core)

Node.js 24 or later. MIT.
