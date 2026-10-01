# Command handlers

A command handler is the application service of one use case that changes the system. It loads an
aggregate through a command repository, calls it, saves it, and returns the outcome in a
[`Result`](../utilities/result.md). The business rules stay in the aggregate.

```ts
export class PlaceOrderHandler extends CommandHandler<PlaceOrder, void, PlaceOrderError> {
	async handle({ orderId, total }: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place(total, this.ids.next(), this.clock.now());
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order);
		return ok();
	}
}
```

## When to use

Write one command handler per request that changes state: create an order, place it, cancel it.
Reads go through a [query handler](./query-handlers.md). A handler coordinates; when you catch it
deciding a business rule, move that rule into the [aggregate](../domain/aggregates.md) or a
[domain service](../domain/domain-services.md).

## Usage

### Declare the command

The command is the input of the handler: a plain type named after the request, in the imperative,
in the same file as its handler. It is what a driving adapter has to provide.

```ts [src/ordering/application/commands/place-order.command.ts]
export interface PlaceOrder {
	readonly orderId: string;
	readonly total: number;
}

export type PlaceOrderError = OrderNotFound | InvalidTotal | OrderAlreadyPlaced;
```

### Write the handler

The handler receives its dependencies in its constructor, as abstract classes: repositories, ports,
the [unit of work](./unit-of-work.md), the [outbox](./outbox.md). With NestJS, `@Injectable()` is the
only framework import the application may use, and the abstract classes double as injection tokens.

```ts [src/ordering/application/commands/place-order.command.ts]
import { Clock, CommandHandler, err, IdGenerator, ok, type Result } from "@alveolus/core";
import { Injectable } from "@nestjs/common";

import { OrderNotFound } from "../../domain/errors/order-not-found.error";
import { Orders } from "../../domain/repositories/orders.repository";
import { OrderId } from "../../domain/value-objects/order-id.identifier";

@Injectable()
export class PlaceOrderHandler extends CommandHandler<PlaceOrder, void, PlaceOrderError> {
	constructor(
		private readonly orders: Orders,
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {
		super();
	}

	async handle({ orderId, total }: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place(total, this.ids.next(), this.clock.now());
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order);
		return ok();
	}
}
```

Import the injected classes as values, not with `import type`: NestJS reads constructor parameter
types at runtime.

### Return the failure of the aggregate as is

The error union of the handler includes the errors of the aggregate. A failed `Result` is returned
unchanged: no re-wrapping, no exception.

<div class="al-compare">

```ts [❌ Avoid]
const placed = order.place(total, this.ids.next(), this.clock.now());
if (!placed.ok) {
	throw new Error(placed.error.type);
}
```

```ts [✅ Prefer]
const placed = order.place(total, this.ids.next(), this.clock.now());
if (!placed.ok) {
	return placed;
}
```

</div>

### Change state and record events atomically

When the change produces events for other contexts, save the aggregate and add its translated
events to the outbox in one unit of work.

```ts
async handle({ orderId, total }: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
	return this.unitOfWork.run(async () => {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place(total, this.ids.next(), this.clock.now());
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order);
		await this.outbox.add(order.pullDomainEvents().map((event) => this.translator.translate(event, { correlationId: orderId })));
		return ok();
	});
}
```

### Return data

A command may return data, such as the identifier of what it created. Set `Output`. A command that
cannot fail may narrow its return type to `Ok`, so callers read the value without checking.

```ts [src/ordering/application/commands/create-order.command.ts]
@Injectable()
export class CreateOrderHandler extends CommandHandler<void, OrderId> {
	constructor(
		private readonly orders: Orders,
		private readonly ids: IdGenerator,
	) {
		super();
	}

	async handle(): Promise<Ok<OrderId>> {
		const order = Order.create(new OrderId(this.ids.next()));
		await this.orders.save(order);
		return ok(order.id);
	}
}
```

### Call it from a driving adapter

A controller builds the command, calls `handle` and turns the `Result` into a response. Domain
errors become HTTP errors there, and nowhere else.

```ts [src/ordering/driving/nestjs/controllers/orders.controller.ts]
const placed = await this.placeOrder.handle({ orderId, total: body.total });
if (!placed.ok) {
	throw new UnprocessableEntityException({ error: placed.error.type, details: placed.error.payload });
}
```

### Keep to the command side

A command handler loads aggregates through command repositories. It never receives a query
repository: decisions come from aggregates, not from views.

<div class="al-compare">

```ts [❌ Avoid]
constructor(private readonly summaries: OrderSummaries) {
	super();
}
```

```ts [✅ Prefer]
constructor(private readonly orders: Orders) {
	super();
}
```

</div>

Checked by [`command-query-separation`](../../rules/command-query-separation.md).

## Reference

```ts
abstract class CommandHandler<Input, Output = void, Error extends AnyDomainError = never> {
	abstract handle(command: Input): Promise<Result<Output, Error>>;
}
```

| Type parameter | Description |
| --- | --- |
| `Input` | The command: the data the handler needs. |
| `Output` | What a success returns. Defaults to `void`. |
| `Error` | Union of the domain errors the handler may return. Defaults to `never`. |

| Member | Type | Description |
| --- | --- | --- |
| `handle(command)` | `Promise<Result<Output, Error>>` | Runs the use case and returns its outcome. |

**Caveats**

- `Error` only accepts `DomainError` subclasses. A technical failure, such as a lost database
  connection, is thrown and handled like any other exception.
- Call `super()` in the constructor of your handler.
- Alveolus provides no bus and no container: wire handlers with your framework.
- The events recorded by the aggregate stay on it after `save`; publish them through the
  [outbox](./outbox.md).

Import from `@alveolus/core` or `@alveolus/core/command-handlers`.

## Troubleshooting

**`Nest can't resolve dependencies of PlaceOrderHandler (?, …)`**: an injected class is imported
with `import type`, or its port has no provider. Import it as a value and register
`{ provide: Orders, useClass: PgOrders }` in the module.

## See also

- [Repositories](../domain/repositories.md), to load and save aggregates
- [Unit of Work](./unit-of-work.md) and [Outbox](./outbox.md), to change and record atomically
- [Query handlers](./query-handlers.md), for requests that only read
- [`command-query-separation`](../../rules/command-query-separation.md), [`layer-direction`](../../rules/layer-direction.md)
