# @alveolus/core

## 0.4.0

### Minor Changes

- cf56a9e: Breaking: `AggregateRoot` takes its events and its snapshot as required type parameters (`never` when it records none), and declares `toSnapshot()`. `Entity` loses its snapshot: an inner entity is written through the snapshot of its aggregate. `AnySnapshot` and `SnapshotValue` are still exported.
- cf56a9e: Breaking: a `DomainEvent` has no id, and its `type` is the name of its class. The `EventTranslator` takes an `IdGenerator` and gives each integration event its id; `translateAll` translates the events of a call under one correlation.
- cf56a9e: `CommandRepository` gains `findByIds`, which returns the aggregates it found and the identities it did not (`{ found, missing }`). By default it calls `findById` for each identity; an adapter replaces it with one query.
- cf56a9e: Breaking: `UnitOfWork` joins the open transaction from a nested `run`, and a nested refusal makes it rollback-only: if the work around it still succeeds, `run` throws `NestedWorkRefused` and rolls back. An adapter now implements `transaction(scope, work)` and `current()` instead of `begin()`, which fits callback transactions such as Prisma's; `Transaction` is removed and `TransactionScope` added.
- cf56a9e: Add `UuidIdentifier`, whose `parse` reads any RFC 9562 UUID in lowercase, and `InvalidIdentifier`, the refusal it returns. Core still generates nothing: an identity builds a generated value from the app's `IdGenerator`.

### Patch Changes

- cf56a9e: Private members are `#` fields, private for JavaScript itself: `OutboxRelay` no longer exposes its outbox, publisher, channel and batch size once compiled.

## 0.3.0

### Minor Changes

- bd17e80: Breaking: the outbox is append-only, as MSG-02 and MSG-03 say. `Outbox.markPublished` is gone: `pending(after, limit)` reads the stored events after a sequence number, in order, and `OutboxRelay` records the last published sequence of its channel with `recordPublished(channel, sequence)`, read back with `lastPublished(channel)`. `OutboxRelay` takes its channel before its batch size.
- 7b6d9be: Breaking: `CommandRepository.save` returns `Promise<Result<void, Refusal>>`, as REP-03 says. `CommandRepository<Aggregate, Refusal>` takes the uniqueness refusals the storage enforces, `never` by default; a repository without one returns `ok()`.

## 0.2.1

### Patch Changes

- 6da206c: The npm page links to the site and its getting started, and shows an example that compiles.

## 0.2.0

### Minor Changes

- d71d72d: New building blocks for tactical and strategic DDD in TypeScript: aggregates, entities, value objects, domain events, ports, command and query handlers, the outbox, and `Result`. This version replaces the former API entirely.

## 0.1.0

### Minor Changes

- The first release out of alpha: the building blocks of *Domain-Driven Design Distilled*, with
  `Result`, the unit of work, the outbox and the integration events, and no runtime dependency.
  Node.js 24 or later.
