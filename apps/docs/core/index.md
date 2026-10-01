# @alveolus/core

Building blocks for tactical Domain-Driven Design, a `Result` type for explicit business errors and
the contracts of the application layer.

`@alveolus/core` has **no runtime dependencies**: it is meant to be imported by your domain layer.

## Installation

::: code-group

```sh [pnpm]
pnpm add @alveolus/core
```

```sh [npm]
npm install @alveolus/core
```

```sh [yarn]
yarn add @alveolus/core
```

```sh [bun]
bun add @alveolus/core
```

:::

## Contents

- [Result](./result.md): `Result<T, E>` and its helpers.
- [Building blocks](./building-blocks.md): `ValueObject`, `Identifier`, `Entity`, `AggregateRoot`,
  `DomainEvent`, `Repository`, `DomainService`, `Policy`.
- [Application contracts](./application-contracts.md): `Command`, `Query`, `UseCase`,
  `EventPublisher`.
