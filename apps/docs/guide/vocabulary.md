# Vocabulary

Alveolus does not invent patterns: it uses the vocabulary of *Domain-Driven Design* by Eric Evans
and *Implementing Domain-Driven Design* by Vaughn Vernon. This page defines each term and where it
stands in Alveolus.

| Status                                   | Meaning                                        |
| ---------------------------------------- | ---------------------------------------------- |
| <Badge type="tip" text="available" />    | Provided by a package and checked where noted. |
| <Badge type="warning" text="planned" />  | Part of the approach, not implemented yet.     |
| <Badge type="info" text="concept" />     | A way of thinking or organising; no code.      |

## Strategic design

| Term                          | Meaning                                                                                                   | Status                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Domain                        | The business area the software serves.                                                                    | <Badge type="info" text="concept" />    |
| Subdomain                     | A part of the domain. *Core* subdomains make the business different, *supporting* ones help it, *generic* ones are common to many businesses. | <Badge type="info" text="concept" />    |
| Ubiquitous Language           | The terms experts and developers share inside a bounded context, used as-is in the code.                  | <Badge type="info" text="concept" />    |
| Bounded Context               | The boundary inside which a model and its language are consistent. A folder under `src/`.                  | <Badge type="tip" text="available" />   |
| Context Map                   | The relationships between bounded contexts, and who depends on whom.                                      | <Badge type="warning" text="planned" /> |

### Context map patterns

| Term                    | Meaning                                                                                       | Status                               |
| ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| Partnership             | Two contexts succeed or fail together and plan their changes jointly.                         | <Badge type="info" text="concept" /> |
| Shared Kernel | A small part of the model that contexts share and change only by agreement. In Alveolus, `src/shared-kernel/`, with shared value objects and technical ports such as the clock. | <Badge type="tip" text="available" /> |
| Customer–Supplier       | The upstream context plans its changes with the needs of the downstream one.                   | <Badge type="info" text="concept" /> |
| Conformist              | The downstream context adopts the upstream model as it is.                                    | <Badge type="info" text="concept" /> |
| Anticorruption Layer    | A translation layer that keeps a foreign model out of your own.                               | <Badge type="info" text="concept" /> |
| Open Host Service       | A context exposes a documented protocol that any client can use.                              | <Badge type="info" text="concept" /> |
| Published Language      | A shared, documented format for the data contexts exchange.                                   | <Badge type="info" text="concept" /> |
| Separate Ways           | Two contexts do not integrate at all.                                                         | <Badge type="info" text="concept" /> |

## Architecture

| Term                       | Meaning                                                                                                    | Status                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Layers | `domain`, `application`, `driven` and `driving`, with dependencies pointing towards the domain. The [project layout](/arch/project-layout) is checked; the dependency rules are not yet. | <Badge type="warning" text="planned" /> |
| Ports and Adapters | The application declares [ports](/core/application/ports) and the domain declares repositories; adapters implement them in `driven/`, checked by `alveolus arch check`, or call the application from `driving/`. | <Badge type="tip" text="available" /> |
| CQRS | Commands change state through aggregates; queries read [views](/core/domain/views) through their own repositories and change nothing. | <Badge type="tip" text="available" /> |
| Event-Driven Architecture  | Parts of the system react to domain events instead of calling each other directly.                         | <Badge type="info" text="concept" />    |
| Event Sourcing             | Storing the events of an aggregate instead of its current state.                                           | Out of scope                            |

## Tactical design

| Term                                      | Meaning                                                                                               | Status                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [Entity](/core/domain/entities)                  | An object defined by its identity, which stays the same while its attributes change.                  | <Badge type="tip" text="available" />   |
| [Identity](/core/domain/entities)                | The value that identifies an entity. Typed, so identities of different entities cannot be mixed up.   | <Badge type="tip" text="available" />   |
| [Value Object](/core/domain/value-objects)       | An immutable object defined only by its attributes, such as an amount or an email address.            | <Badge type="tip" text="available" />   |
| [Domain Service](/core/domain/domain-services)      | Domain logic that does not belong to a single entity or value object.                                 | <Badge type="tip" text="available" />   |
| [Policy](/core/domain/policies)                     | A business rule made explicit as an object, so it can be named, tested and replaced.                  | <Badge type="tip" text="available" />   |
| Specification                             | A predicate that says whether an object satisfies a business criterion.                               | <Badge type="info" text="concept" />    |
| [Domain Event](/core/domain/domain-events)       | Something that happened in the domain, named in the past tense.                                       | <Badge type="tip" text="available" />   |
| Module | A named group of code. In Alveolus, each layer is split by kind: `domain/aggregates/`, `domain/value-objects/`, `application/commands/`…, and each file name ends with its kind, such as `order.aggregate.ts`. See [Project layout](/arch/project-layout). | <Badge type="tip" text="available" /> |
| [Aggregate](/core/domain/aggregates) | A cluster of objects kept consistent as one unit and changed only through its root. It exports its state as a snapshot for its repository. | <Badge type="tip" text="available" /> |
| [Factory](/core/domain/aggregates#validate-input-in-a-factory) | The place that creates complex objects in a valid state. In Alveolus, a static method on the aggregate, the entity or the value object, the only way to call its non-public constructor; `fromSnapshot` rebuilds an object from storage. | <Badge type="tip" text="available" /> |
| [Repository](/core/domain/repositories) | A collection-like port to load and save aggregates, declared in the domain. Its adapter stores the snapshot of the aggregate. | <Badge type="tip" text="available" /> |
| [View](/core/domain/views) | A business read model returned by a query, declared in the domain and read through its own repository. | <Badge type="tip" text="available" /> |
| [Domain Error](/core/domain/domain-errors)            | An expected business failure, returned in a `Result` rather than thrown.                              | <Badge type="tip" text="available" />   |

## Application

| Term                    | Meaning                                                                                                 | Status                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [Application Service](/core/application/command-handlers) | Coordinates a use case: loads aggregates, calls them, saves them and publishes their events. In Alveolus, a command handler or a query handler. | <Badge type="tip" text="available" /> |
| [Command](/core/application/command-handlers) | A request to change the system, named in the imperative (`PlaceOrder`), handled by a command handler. | <Badge type="tip" text="available" /> |
| [Query](/core/application/query-handlers) | A request to read data, without side effects, handled by a query handler that returns a view. | <Badge type="tip" text="available" /> |
| [Event Publisher](/core/application/event-publishers) | The port that publishes domain events once an aggregate is saved.                                  | <Badge type="tip" text="available" /> |
| [Port](/core/application/ports)                 | A technical capability the application needs (clock, mailer), implemented by a driven adapter.     | <Badge type="tip" text="available" /> |

## Integration

| Term                    | Meaning                                                                                                 | Status                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [Notification](/core/application/notifications) | A domain event wrapped with an identifier, a format version and application metadata (such as an audit trail), published to other bounded contexts. | <Badge type="tip" text="available" /> |
| Eventual Consistency    | Other aggregates and contexts catch up after an event, instead of changing in the same transaction.     | <Badge type="info" text="concept" />    |
