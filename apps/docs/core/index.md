# @alveolus/core

The building blocks of the domain model. No runtime dependencies.

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

## Exports

Everything is exported from `@alveolus/core`, and from the subpath of its building block.

### Domain

| Page                                          | Exports                                                        | Subpath                         |
| --------------------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| [Aggregates](./domain/aggregates.md)          | `AggregateRoot`, `AggregateRootOptions`, `AnyAggregateRoot`    | `@alveolus/core/aggregates`     |
| [Value Objects](./domain/value-objects.md)    | `ValueObject`, `AnyValueObject`                                | `@alveolus/core/value-objects`  |
| [Entities](./domain/entities.md)              | `Entity`, `AnyEntity`, `Identifier`, `IdentifierValue`, `AnyIdentifier`, `JsonValue` | `@alveolus/core/entities`       |
| [Domain Events](./domain/domain-events.md)    | `DomainEvent`, `DomainEventProps`, `AnyDomainEvent`            | `@alveolus/core/domain-events`  |
| [Domain Errors](./domain/domain-errors.md)    | `DomainError`, `AnyDomainError`                                | `@alveolus/core/domain-errors`  |
| [Domain Services](./domain/domain-services.md) | `DomainService`                                                | `@alveolus/core/domain-services` |
| [Policies](./domain/policies.md)              | `Policy`                                                       | `@alveolus/core/policies`       |
| [Repositories](./domain/repositories.md)      | `Repository`, `ConcurrencyError`                               | `@alveolus/core/repositories`   |
| [Views](./domain/views.md)                    | `ViewRepository`                                               | `@alveolus/core/views`          |

### Application

| Page                                                  | Exports          | Subpath                           |
| ----------------------------------------------------- | ---------------- | --------------------------------- |
| [Command handlers](./application/command-handlers.md) | `CommandHandler` | `@alveolus/core/command-handlers` |
| [Query handlers](./application/query-handlers.md)     | `QueryHandler`   | `@alveolus/core/query-handlers`   |
| [Event publishers](./application/event-publishers.md) | `EventPublisher` | `@alveolus/core/event-publishers` |
| [Notifications](./application/notifications.md) | `Notification`, `NotificationProps`, `NotificationPublisher`, `AnyNotification` | `@alveolus/core/notifications` |
| [Ports](./application/ports.md)                 | `Port`           | `@alveolus/core/ports`            |

### Utilities

| Page                                | Exports                                                  | Subpath                  |
| ----------------------------------- | -------------------------------------------------------- | ------------------------ |
| [Result](./utilities/result.md)     | `Result`, `Ok`, `Err`, `ok`, `err`, `map`, `mapErr`, `andThen`, `combine` | `@alveolus/core/result` |

The package is published as ES modules.
