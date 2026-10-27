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

An identity extends `UuidIdentifier`: `of` reads any RFC 9562 UUID and refuses the rest with `InvalidIdentifier`.
Core generates nothing: `generate` builds a value that the app's `IdGenerator` gives.

```ts
import { IdGenerator, InvalidIdentifier, type Result, UuidIdentifier } from '@alveolus/core';

export class WalletId extends UuidIdentifier<'WalletId'> {
	private constructor(value: string) {
		super(value);
	}

	static generate(ids: IdGenerator): WalletId {
		return new WalletId(ids.next());
	}

	static of(value: string): Result<WalletId, InvalidIdentifier> {
		return WalletId.parse(value, (valid) => new WalletId(valid));
	}
}
```

Each class says what it is: an aggregate extends `AggregateRoot`, a value object `ValueObject`.

Each outcome has one channel. A business refusal is a `Result` with a named error, an absence is `undefined`, a
failure is an exception. A repository's `save` returns a `Result`, even when nothing can refuse (`never`), and its
finders return the aggregate or `undefined`: the use case decides which refusal an absence becomes.
`findByIds` returns the aggregates it found and the identities it did not (`{ found, missing }`).

- [Documentation](https://alveolus.dev/)
- [Getting started](https://alveolus.dev/start/getting-started)
- [Source](https://github.com/alveolusjs/alveolus/tree/main/packages/core)

Node.js 24 or later. MIT.
