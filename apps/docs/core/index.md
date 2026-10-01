# Building blocks

`@alveolus/core` gives you the building blocks of Domain-Driven Design as abstract classes. Your
classes extend them: `Order extends AggregateRoot`, `Money extends ValueObject`. The class says what
it is, and [`alveolus arch check`](../rules/index.md) knows where it belongs and what it may depend
on.

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

## Domain

The model and what it needs from the outside world. Everything here lives in `domain/` and imports
nothing but the domain.

| Building block | What it is |
| --- | --- |
| [Aggregates](./domain/aggregates.md) | A cluster of objects changed as one unit, through its root, which records domain events. |
| [Entities](./domain/entities.md) | An object defined by its identity, inside an aggregate. |
| [Value objects](./domain/value-objects.md) | An immutable value compared by its attributes, and the typed identifiers. |
| [Domain events](./domain/domain-events.md) | Something that happened in the domain, in the past tense. |
| [Domain errors](./domain/domain-errors.md) | An expected business failure, returned as a value. |
| [Domain services](./domain/domain-services.md) | A stateless operation that belongs to no single object. |
| [Ports](./domain/ports.md) | What the domain needs from the outside world, in its own words. |
| [Repositories](./domain/repositories.md) | How aggregates are loaded and saved, and how views are read. |
| [Views](./domain/views.md) | What a query returns. |

## Application

The use cases, and the contracts that make them atomic and reliable. Everything here lives in
`application/`, except the adapters that implement the contracts.

| Building block | What it is |
| --- | --- |
| [Command handlers](./application/command-handlers.md) | The application service of one use case that changes the system. |
| [Query handlers](./application/query-handlers.md) | The application service of one read. |
| [Event translators](./application/event-translators.md) | Turns domain events into integration events. |
| [Integration events](./application/integration-events.md) | What other contexts receive when something happens: JSON. |
| [Event publishers](./application/event-publishers.md) | Sends integration events to the rest of the system. |
| [Unit of Work](./application/unit-of-work.md) | Makes a use case atomic: commit on success, roll back otherwise. |
| [Outbox](./application/outbox.md) | Stores integration events with the change, then relays them, so none is lost. |

## Strategic

How bounded contexts meet without sharing a model. See also the
[bounded contexts](../guide/project-layout.md#bounded-contexts) of the project layout.

| Building block | What it is |
| --- | --- |
| [Published Language](./strategic/published-language.md) | The JSON format exchanged between contexts. |
| [Open host services](./strategic/open-host-services.md) | The documented entry point of a context, the only class others may import. |
| [Anti-corruption layers](./strategic/anti-corruption-layers.md) | The adapter that reads another context and translates it into yours. |

## Utilities

| Building block | What it is |
| --- | --- |
| [Result](./utilities/result.md) | Success or failure as a value, with the helpers to combine them. |

## Principles

- **You extend, nothing is configured.** No decorator, no registry, no reflection: the class you
  extend says what your class is. A class extending your own base class counts too.
- **Business errors are values.** An expected failure is a `DomainError` returned in a `Result`,
  never thrown. Each signature lists what can go wrong. Exceptions stay for bugs.
- **The domain never reads the clock nor generates ids.** Dates and ids are parameters of business
  methods; `Clock` and `IdGenerator` give them to the application.
- **No infrastructure.** No bus, no container, no ORM. Repositories, ports and publishers are
  abstract classes your adapters extend with the tools you already use; with NestJS, the same
  classes are the injection tokens.
- **No runtime dependency.** `@alveolus/core` ends up in your domain and brings nothing with it.

## Import paths

Import everything from `@alveolus/core`, or each building block from its own entry point, named
after its page: `@alveolus/core/aggregates`, `@alveolus/core/value-objects`,
`@alveolus/core/command-handlers`, `@alveolus/core/result`… Both give the same classes.
