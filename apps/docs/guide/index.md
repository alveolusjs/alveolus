# Introduction

Alveolus is a modular, opt-in toolkit for tactical **Domain-Driven Design** in TypeScript.

::: warning Work in progress
Alveolus is under active development. Packages are not published yet and APIs may change.
:::

It provides two things:

1. **Building blocks**: base classes to model a domain (`Entity`, `AggregateRoot`, `ValueObject`,
   `Identifier`, `DomainEvent`, `Repository`, `DomainService`, `Policy`) and a `Result` type for
   explicit business errors.
2. **Architecture tests**: a CLI that statically checks that your codebase respects DDD rules and
   the Alveolus project layout.

Each package can be used on its own. Alveolus imposes no infrastructure: no bus, no DI container,
no ORM integration.

## Packages

| Package             | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| [`@alveolus/core`](/core/)    | Building blocks, `Result`, application contracts. No runtime dependencies. |
| [`@alveolus/arch`](/arch/)    | Architecture rules and the `alveolus` CLI.                 |
| [`@alveolus/testing`](/testing/) | Test helpers: in-memory repositories, fakes, matchers.     |

## Design principles

- **Object-oriented.** Building blocks are abstract classes you extend:
  `class Order extends AggregateRoot<OrderId>`.
- **Errors are values.** Expected business failures are returned as `Result<T, E>`, never thrown.
  Exceptions are reserved for bugs and broken invariants.
- **Immutable by default.** Value objects are immutable; entities expose behaviour, not setters.
- **Explicit over magic.** No reflection, no decorators, no global registries.
