# Getting started

This guide builds an `Order` aggregate, tests it, and checks it with the architecture rules.

::: warning
Packages are not published on npm yet.
:::

## Install

::: code-group

```sh [pnpm]
pnpm add @alveolus/core
pnpm add -D @alveolus/testing @alveolus/arch
```

```sh [npm]
npm install @alveolus/core
npm install -D @alveolus/testing @alveolus/arch
```

```sh [yarn]
yarn add @alveolus/core
yarn add -D @alveolus/testing @alveolus/arch
```

```sh [bun]
bun add @alveolus/core
bun add -D @alveolus/testing @alveolus/arch
```

:::

The packages are ES modules.

## Project layout

Each bounded context is a folder under `src/`. Its domain model goes in a `domain` folder, with one
folder per kind of building block:

```
src/
  ordering/
    domain/
      aggregates/
        order.ts
        order.test.ts
      errors/
        order-errors.ts
      events/
        order-placed.ts
      value-objects/
        order-id.ts
  shared-kernel/
    domain/
      value-objects/      # value objects shared by every bounded context
```

`alveolus arch check` reports a building block declared in the wrong folder.

## 1. Identifier

An identifier per aggregate. The second type parameter keeps it from being mixed up with other
identifiers.

```ts [src/ordering/domain/value-objects/order-id.identifier.ts]
import { Identifier } from "@alveolus/core";

export class OrderId extends Identifier<string, "OrderId"> {}
```

## 2. Domain event

What happened, named in the past tense, with its data.

```ts [src/ordering/domain/events/order-placed.event.ts]
import { DomainEvent } from "@alveolus/core";
import type { OrderId } from "../value-objects/order-id.identifier.ts";

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}
```

## 3. Business errors

Expected failures are values returned in a `Result`, not exceptions. Declare one class per failure.

```ts [src/ordering/domain/errors/order.error.ts]
import { DomainError } from "@alveolus/core";

export class OrderAlreadyPlaced extends DomainError {}

export class InvalidTotal extends DomainError<{ total: number }> {}
```

## 4. Aggregate

The aggregate changes its state through business methods. Each public method returns a `Result`
and records the events it raises. The aggregate is created through a static factory, and receives
the current date instead of reading the clock.

```ts [src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot, err, ok, type Result } from "@alveolus/core";
import { InvalidTotal, OrderAlreadyPlaced } from "../errors/order.error.ts";
import { OrderPlaced } from "../events/order-placed.event.ts";
import { OrderId } from "../value-objects/order-id.identifier.ts";

export type OrderSnapshot = { id: string; placed: boolean };

export class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderPlaced> {
	private placed = false;

	private constructor(id: OrderId, version = 0) {
		super(id, { version });
	}

	static create(id: OrderId): Order {
		return new Order(id);
	}

	static fromSnapshot(snapshot: OrderSnapshot, version: number): Order {
		const order = new Order(new OrderId(snapshot.id), version);
		order.placed = snapshot.placed;
		return order;
	}

	toSnapshot(): OrderSnapshot {
		return { id: this.id.value, placed: this.placed };
	}

	place(total: number, now: Date): Result<void, OrderAlreadyPlaced | InvalidTotal> {
		if (this.placed) {
			return err(new OrderAlreadyPlaced());
		}
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		this.placed = true;
		this.record(
			new OrderPlaced({
				aggregateId: this.id,
				occurredAt: now,
				payload: { total },
			}),
		);
		return ok();
	}
}
```

## 5. Test

Describe each behaviour as a scenario. The example uses Vitest; any test runner works.

```ts [src/ordering/domain/aggregates/order.aggregate.test.ts]
import { given } from "@alveolus/testing";
import { describe, it } from "vitest";
import { InvalidTotal, OrderAlreadyPlaced } from "../errors/order.error.ts";
import { OrderPlaced } from "../events/order-placed.event.ts";
import { OrderId } from "../value-objects/order-id.identifier.ts";
import { Order } from "./order.aggregate.ts";

const now = new Date("2026-01-01T10:00:00Z");

describe("Order", () => {
	it("records OrderPlaced when placed", () => {
		given(Order.create(new OrderId("ord_1")))
			.when((order) => order.place(42, now))
			.thenSucceeded()
			.thenRecorded(OrderPlaced, { total: 42 });
	});

	it("rejects a total that is not positive", () => {
		given(Order.create(new OrderId("ord_1")))
			.when((order) => order.place(0, now))
			.thenFailedWith(InvalidTotal, { total: 0 })
			.thenRecordedNothing();
	});

	it("is placed only once", () => {
		const order = Order.create(new OrderId("ord_1"));
		order.place(42, now);

		given(order)
			.when((o) => o.place(42, now))
			.thenFailedWith(OrderAlreadyPlaced)
			.thenRecordedNothing();
	});
});
```

## 6. Check the architecture

Add a script to `package.json`:

```json [package.json]
{
	"scripts": {
		"arch": "alveolus arch check"
	}
}
```

```sh
pnpm arch
```

```
✔ No violations
```

Run it in CI next to your tests: the command exits with `1` when a rule is broken. Try it: replace
`now` with `new Date()` in `place`, and the check reports `aggregate/no-hidden-clock`.

## Next

- [Aggregates](/core/domain/aggregates), [Result](/core/utilities/result) and the
  other building blocks
- [`@alveolus/arch`](/arch/) for every rule and the CLI options
- [`@alveolus/testing`](/testing/) for every assertion
