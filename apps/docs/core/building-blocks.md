# Building blocks

All building blocks are abstract classes. The architecture tests recognise them **by inheritance**,
so your domain classes must extend them.

## ValueObject

Immutable, compared by value with `equals`. Created through a static factory that validates input
and returns a `Result`:

```ts
const email = Email.create("jane@example.com"); // Result<Email, InvalidEmail>
```

## Identifier

A typed identifier, itself a value object:

```ts
class OrderId extends Identifier<string> {}
```

## Entity

Has an identity and is compared by it. Exposes behaviour, not setters.

## AggregateRoot

An entity that guards a consistency boundary and records domain events. Events are collected
internally and retrieved with `pullDomainEvents()`, which returns them and clears the list.
Publishing them is the caller's job, typically the repository or a unit of work.

## DomainEvent

Something that happened in the domain. Named in the past tense (`OrderPlaced`), it carries
`occurredAt`, the `aggregateId` and a payload.

## Repository

A port, declared as an interface in the domain layer, to load and save aggregates. Implementations
live in `driven/`.

## DomainService and Policy

Base classes for stateless domain logic that does not belong to a single aggregate, and for
business rules.
