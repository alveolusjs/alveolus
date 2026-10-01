# placement

Each class lives in the folder of its kind, in a file whose name ends with that kind, one class per
file. Knowing what a class is tells you where it is, and the other way round.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/order.ts]
import { AggregateRoot, Identifier } from "@alveolus/core";

export class OrderId extends Identifier<string, "OrderId"> {}

export class Order extends AggregateRoot<OrderId> {}
```

```ts [✅ Prefer: src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot } from "@alveolus/core";

import type { OrderId } from "../value-objects/order-id.identifier";

export class Order extends AggregateRoot<OrderId> {}
```

</div>

## What it checks

- A file declares one class at most.
- A class that extends a building block is in the folder and the file of its kind:

| Extends | Folder | File name ends with |
| --- | --- | --- |
| `AggregateRoot` | `domain/aggregates/` | `.aggregate.ts` |
| `Entity` | `domain/entities/` | `.entity.ts` |
| `Identifier` | `domain/value-objects/` | `.identifier.ts` |
| `ValueObject` | `domain/value-objects/` | `.value-object.ts` |
| `DomainEvent` | `domain/events/` | `.event.ts` |
| `DomainError` | `domain/errors/` | `.error.ts` |
| `DomainService` | `domain/services/` | `.service.ts` |
| `CommandRepository`, `QueryRepository` (abstract) | `domain/repositories/` | `.repository.ts` |
| `Port` (abstract) | `domain/ports/` | `.port.ts` |
| `CommandHandler` | `application/commands/` | `.command.ts` |
| `QueryHandler` | `application/queries/` | `.query.ts` |
| `EventTranslator` | `application/translators/` | `.translator.ts` |
| A port (concrete class) | `driven/<technology>/adapters/` | `.adapter.ts` |
| implements `OpenHostService` or `AntiCorruptionLayer`, without a port | `driving/` | free |

The types that belong to a class, such as its snapshot or its command input, stay in its file.
Classes that extend no building block, such as a controller or a module, are not placed by this
rule.

## Why

A layout that every project shares is only useful if it holds. With one class per file, in the
folder of its kind, finding a concept takes no search, a review shows at a glance what a change
touches, and an agent puts new code where the existing code is.

## What it reports

```
src/ordering/domain/order.ts:3
  placement: OrderId belongs in domain/value-objects/*.identifier.ts.

src/ordering/domain/order.ts:5
  placement: Order shares its file with OrderId: one class per file.

src/ordering/domain/order.ts:5
  placement: Order belongs in domain/aggregates/*.aggregate.ts.
```

## Turn it off

```ts
rules: { placement: "off" }
```

## See also

- [Project layout: folders and file names](../guide/project-layout.md#folders-and-file-names)
- [`building-blocks-only`](./building-blocks-only.md)
