# Application contracts

`@alveolus/core` describes the application layer with interfaces only. Alveolus ships no command
bus, no query bus and no implementation: wire use cases the way you like.

| Contract         | Role                                                         |
| ---------------- | ------------------------------------------------------------ |
| `Command`        | An intent to change the system.                              |
| `Query`          | A request for data, without side effects.                    |
| `UseCase`        | Handles one command or query and returns a `Result`.         |
| `EventPublisher` | Port used to publish the domain events pulled from aggregates. |

Use cases live in the `application/` layer of a bounded context. See the
[project layout](/guide/project-layout).
