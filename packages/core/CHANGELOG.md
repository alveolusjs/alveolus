# @alveolus/core

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
