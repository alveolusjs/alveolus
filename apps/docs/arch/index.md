# @alveolus/arch

Checks that a codebase built with `@alveolus/core` follows the Alveolus rules. Building blocks are
recognised by inheritance: a class that extends `AggregateRoot`, `Entity`, `ValueObject`,
`Identifier`, `DomainEvent`, `DomainError`, `DomainService` or `Policy` is checked against the rules of that building block.

## Installation

::: code-group

```sh [pnpm]
pnpm add -D @alveolus/arch
```

```sh [npm]
npm install -D @alveolus/arch
```

```sh [yarn]
yarn add -D @alveolus/arch
```

```sh [bun]
bun add -D @alveolus/arch
```

:::

## Usage

Run the check in CI next to your tests. See [CLI](./cli.md) for options, output and exit codes.

```sh
alveolus arch check
```

## Rules

Rule ids are prefixed by the building block, such as `aggregate/no-io` or `value-object/no-io`.

| Building block | Rules                                                                                                                                                                        | Page                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Aggregate      | `reference-by-identity`, `no-public-mutable-state`, `public-methods-return-result`, `non-public-constructor`, `from-snapshot`, `no-hidden-clock`, `no-io`, `no-inheritance`, `one-per-file`  | [Aggregates](./rules/aggregates.md)        |
| Entity         | `reference-by-identity`, `no-domain-events`, `no-public-mutable-state`, `public-methods-return-result`, `non-public-constructor`, `from-snapshot`, `no-hidden-clock`, `no-io`                 | [Entities](./rules/entities.md)            |
| Value object   | `immutable`, `no-identity`, `factories-return-result`, `non-public-constructor`, `no-hidden-clock`, `no-io`                                                                  | [Value Objects](./rules/value-objects.md)  |
| Domain event   | `past-tense`, `no-static-members`                                                                                                                                            | [Domain Events](./rules/domain-events.md)  |
| Domain service | `stateless`, `no-hidden-clock`, `no-io`                                                                                                                                      | [Domain Services](./rules/domain-services.md)|
| Policy         | `stateless`, `no-hidden-clock`, `no-io`                                                                                                                                      | [Policies](./rules/policies.md)            |
| Repository     | `adapter-location`                                                                                                                                                           | [Repositories](./rules/repositories.md)    |
| All            | `location`, `file-suffix`, `adapter-location`, for building blocks, handlers, commands, queries, metadata, views and ports                                                  | [Project layout](./project-layout.md)      |
