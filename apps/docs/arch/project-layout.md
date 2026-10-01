# Project layout

Alveolus expects one layout. Each bounded context is a folder under `src/`, split into layers; its
domain model is grouped by kind of building block, and each file name ends with the kind of what
it declares. What every bounded context shares goes in `src/shared-kernel/`, with the same layout: shared value objects, and technical ports such as the
clock.

```
src/
  ordering/
    index.ts                          # public API of the bounded context
    domain/
      aggregates/order.aggregate.ts         # AggregateRoot
      entities/order-line.entity.ts         # Entity
      value-objects/order-id.identifier.ts  # Identifier
      value-objects/address.value-object.ts # ValueObject
      events/order-placed.event.ts          # DomainEvent
      errors/empty-order.error.ts           # DomainError
      services/shipping-cost.service.ts     # DomainService
      policies/overbooking.policy.ts        # Policy
      repositories/order.repository.ts      # Repository port
      repositories/order-summary.repository.ts # view repository
      views/order-summary.view.ts           # view: business read model
    application/
      commands/place-order.command.ts       # command and its CommandHandler
      queries/get-order-summary.query.ts    # query and its QueryHandler
      ports/payment-gateway.port.ts         # technical ports of the bounded context
      metadata/audit.metadata.ts            # notification metadata
    driven/                           # repositories, view repositories, HTTP clients, queues
    driving/                          # HTTP controllers, CLI, consumers
  shared-kernel/
    domain/
      value-objects/money.value-object.ts
    application/
      ports/clock.port.ts                   # technical ports shared by every bounded context
```

Tests sit next to the code they test and keep its name, such as
`aggregates/order.aggregate.test.ts`. [Views](/core/domain/views) are business read models returned
by [query handlers](/core/application/query-handlers): they live in the domain with their
repositories.

## Rules

| Rule                          | Declares                          | Folder                  | File name              |
| ----------------------------- | --------------------------------- | ----------------------- | ---------------------- |
| `aggregate/*`                 | `AggregateRoot`                   | `domain/aggregates/`    | `*.aggregate.ts`       |
| `entity/*`                    | `Entity`                          | `domain/entities/`      | `*.entity.ts`          |
| `value-object/*`              | `ValueObject`                     | `domain/value-objects/` | `*.value-object.ts`    |
| `identifier/*`                | `Identifier`                      | `domain/value-objects/` | `*.identifier.ts`      |
| `domain-event/*`              | `DomainEvent`                     | `domain/events/`        | `*.event.ts`           |
| `domain-error/*`              | `DomainError`                     | `domain/errors/`        | `*.error.ts`           |
| `domain-service/*`            | `DomainService`                   | `domain/services/`      | `*.service.ts`         |
| `policy/*`                    | `Policy`                          | `domain/policies/`      | `*.policy.ts`          |
| `repository/*`                | interface extending `Repository`  | `domain/repositories/`  | `*.repository.ts`      |
| `command-handler/*`           | class implementing `CommandHandler` | `application/commands/` | `*.command.ts`     |
| `query-handler/*`             | class implementing `QueryHandler` | `application/queries/`  | `*.query.ts`           |
| `view/*`                      | type passed to `ViewRepository`   | `domain/views/`         | `*.view.ts`            |
| `view-repository/*`           | interface extending `ViewRepository` | `domain/repositories/` | `*.repository.ts`   |
| `port/*`                      | interface extending `Port`        | `application/ports/`    | `*.port.ts`            |
| `command/*`                   | input type of a `CommandHandler`  | `application/commands/` | `*.command.ts`         |
| `query/*`                     | input type of a `QueryHandler`    | `application/queries/`  | `*.query.ts`           |
| `metadata/*`                  | metadata type of a `Notification` or `NotificationPublisher` | `application/metadata/` | `*.metadata.ts` |
| `*/adapter-location`          | class implementing a `Repository`, a `ViewRepository` or a `Port` | `driven/` |              |

Each line is two rules: `<kind>/location` checks the folder and `<kind>/file-suffix` the end of the
file name. A file may sit in a subfolder of its folder, such as `domain/aggregates/order/`. Ports
may also live in `src/shared-kernel/application/ports/`. Types declared inline, such as
`CommandHandler<{ orderId: string }>`, are not checked.

::: details Why?
Grouping by kind makes the model easy to scan: all the aggregates of a bounded context are in one
place. The suffix says what a file holds before it is opened, in a search, a tab or a review, and
tools and agents know where to look and where to add code.
:::

## Troubleshooting

### `<Name>` is `<a kind>`; declare it in a domain/`<folder>`/ folder

Move the file to the folder named in the message, under the `domain` folder of its bounded context
or of the shared kernel.

### `<Name>` is `<a kind>`; name its file `<name>.<suffix>.ts`

Rename the file so that it ends with the suffix of its kind, such as `order.aggregate.ts`, and
update its imports.

### `<Name>` is a command handler; declare it in an application/commands/ folder

Move the file to `src/<bounded-context>/application/commands/`; query handlers go in
`application/queries/`.

### `<Name>` implements `<a port>`; declare it in a driven/ folder

Move the class to `src/<bounded-context>/driven/`. Adapters of repositories, view repositories and
ports all live there. See [Repository rules](./rules/repositories.md).

## See also

- [Rules](./index.md#rules), for each building block
- [Repositories](/core/domain/repositories), ports in the domain, adapters in `driven/`
- [Command handlers](/core/application/command-handlers) and [query handlers](/core/application/query-handlers)
- [Views](/core/domain/views) and [Ports](/core/application/ports)
