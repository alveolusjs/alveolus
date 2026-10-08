---
description: "Architecture rule: each class lives in the folder of its kind, in a file named after that kind, one class per file."
---

# no-misplaced-class

Each class lives in the folder of its kind, in a file whose name ends with that kind, one class per
file.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-misplaced-class</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A class in the wrong folder or file, two classes in one file</dd>
	<dt>Applies to</dt><dd>Every class that extends a building block, in every bounded context and the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-misplaced-class": "off"</code></a></dd>
</dl>

## Why

`OrderId` and `Order` are declared together in `domain/aggregates/order.ts`, because that is where the task
started. The next developer looks for the identifier in `value-objects/` and does not find it; the
next agent creates a second one there. The shared layout only helps if it holds.

::: tip The fix
The kind of a class decides where it lives: `Order` extends `AggregateRoot`, so it is in
`domain/aggregates/order.aggregate.ts`, alone. Finding a concept takes no search, a review shows at
a glance what a change touches, and an agent puts new code where the existing code is.
:::

## What it checks

Two things, in every file:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>One class per file</span>The types that belong to a class, such as its snapshot or its command input, stay in its file.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>The folder and file of its kind</span>A class that extends a building block is where the table below says, whatever its name.</div>
</div>

| Extends | Folder | File name ends with |
| --- | --- | --- |
| `AggregateRoot` | `domain/aggregates/` | `.aggregate.ts` |
| `Entity` | `domain/entities/` | `.entity.ts` |
| `Identifier` | `domain/value-objects/` | `.identifier.ts` |
| `ValueObject` | `domain/value-objects/` | `.value-object.ts` |
| `DomainEvent` | `domain/events/` | `.event.ts` |
| `DomainError` | `domain/errors/` | `.error.ts` |
| `DomainService` | `domain/services/` | `.service.ts` |
| `CommandRepository`<br>`QueryRepository` | `domain/repositories/` | `.repository.ts` |
| `Port`, abstract | `domain/ports/` | `.port.ts` |
| `CommandHandler` | `application/commands/` | `.command.ts` |
| `QueryHandler` | `application/queries/` | `.query.ts` |
| `EventTranslator` | `application/translators/` | `.translator.ts` |
| a port, concrete | `driven/<technology>/adapters/` | `.adapter.ts` |

A marker fixes the place of its class, whatever the class extends: a class that implements
`AntiCorruptionLayer` is an adapter in `driven/<technology>/adapters/*.adapter.ts`, a class that
implements `OpenHostService` lives under `driving/<technology>/`, with any file name. A command
handler marked as an anti-corruption layer is reported. Classes that extend no building block, such as a controller
or a module, are not placed by this rule.

## What it reports

```
src/ordering/domain/aggregates/order.ts
  3  error  tactical/no-misplaced-class: OrderId belongs in
  domain/value-objects/*.identifier.ts.
  5  error  tactical/no-misplaced-class: Order shares its file
  with OrderId: one class per file.
```

A class that shares its file is reported for that only: its place is checked once it has a file
of its own.

## Fix it

### Move each class to the file of its kind

Split the file, then move each class to the folder and file name the message gives. Import the
others from their new place.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.ts]
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

### Keep the types of a class in its file

A snapshot, a command input or an error union is not a class: it stays next to the class it
belongs to, and the rule does not report it.

```ts [src/ordering/application/commands/place-order.command.ts]
export interface PlaceOrder {
	readonly orderId: string;
}

export type PlaceOrderError =
	| OrderNotFound
	| OrderAlreadyPlaced
	| EmptyOrder;

export class PlaceOrderHandler extends CommandHandler<
	PlaceOrder,
	void,
	PlaceOrderError
> { … }
```

## Limits

::: warning What the rule cannot see
- A class that extends no building block: it has no place to be in, so the rule leaves it alone;
  `tactical/no-loose-code` reports it in the domain and the application.
- The file name and the class name: `order.aggregate.ts` may declare `Invoice`. The suffix is
  checked, the stem is not.
- Types and interfaces: a `View` in `domain/views/` is a type, and the rule places classes.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-misplaced-class": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new code keeps the layout while you move the old one.

## See also

- [Project layout: folders and file names](../../guide/project-layout.md#folders-and-file-names)
- [`tactical/no-loose-code`](./no-loose-code.md), so that every class has a kind
- [Rules](../index.md), every rule by category
