# Command handlers

A command handler is the application service of one use case that changes the system. It loads the
aggregate, calls it, saves it and publishes its events. Business failures come back in a
[`Result`](../utilities/result.md).

```ts
export class PlaceOrderHandler implements CommandHandler<PlaceOrder, void, OrderNotFound | InvalidTotal> {
	async handle({ orderId, total }: PlaceOrder): Promise<Result<void, OrderNotFound | InvalidTotal>> {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ id: orderId }));
		}
		const placed = order.place(total, new Date());
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order);
		await this.publisher.publish(order.pullDomainEvents());
		return ok();
	}
}
```

## When to use

Write one command handler per request that changes state: place an order, cancel it, add a line.
The business rules stay in the [aggregates](../domain/aggregates.md) and
[domain services](../domain/domain-services.md); the handler only coordinates them with the
[repositories](../domain/repositories.md) and the [event publisher](./event-publishers.md). For a
request that only reads, write a [query handler](./query-handlers.md).

## Usage

### Declare the command

The command is the input of the handler, named in the imperative. A plain type is enough: it is the
data a driving adapter (HTTP controller, CLI, consumer) has to provide.

```ts [src/ordering/application/commands/place-order.command.ts]
export interface PlaceOrder {
	readonly orderId: string;
	readonly total: number;
}
```

### Write the handler

The handler receives its ports in its constructor and declares the domain errors it can return.
Return the failure of the aggregate as is: its error type is part of the handler's union.

```ts [src/ordering/application/commands/place-order.command.ts]
import type { CommandHandler, EventPublisher, Result } from "@alveolus/core";
import { err, ok } from "@alveolus/core";

export class PlaceOrderHandler implements CommandHandler<PlaceOrder, void, OrderNotFound | InvalidTotal> {
	constructor(
		private readonly orders: OrderRepository,
		private readonly publisher: EventPublisher,
	) {}

	async handle({ orderId, total }: PlaceOrder): Promise<Result<void, OrderNotFound | InvalidTotal>> {
		// load, call, save, publish
	}
}
```

### Return data

A command may return data, such as the identifier of what it created. Whether your commands do is
a team decision; set `Output` accordingly.

```ts
export class CreateOrderHandler implements CommandHandler<CreateOrder, OrderId> {
	async handle(): Promise<Result<OrderId, never>> {
		const order = Order.create(new OrderId(randomUUID()));
		await this.orders.save(order);
		await this.publisher.publish(order.pullDomainEvents());
		return ok(order.id);
	}
}
```

### Call it from a driving adapter

The adapter builds the command, calls `handle` and maps the result. Technical failures, such as a
`ConcurrencyError`, are thrown and handled like any other exception.

```ts [src/ordering/driving/http/order-controller.ts]
const result = await placeOrder.handle({ orderId: request.params.id, total: request.body.total });
if (!result.ok) {
	return reply.status(422).send({ error: result.error.type, ...result.error.payload });
}
return reply.status(204).send();
```

## Reference

```ts
interface CommandHandler<Input, Output = void, Error extends AnyDomainError = never>
```

| Type parameter | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| `Input`        | The command: the data the handler needs.                                  |
| `Output`       | What a success returns. Defaults to `void`.                               |
| `Error`        | Union of the domain errors the handler can return. Defaults to `never`.  |

| Member            | Type                              | Description                                   |
| ----------------- | --------------------------------- | --------------------------------------------- |
| `handle(command)` | `Promise<Result<Output, Error>>`  | Runs the use case and returns its outcome.    |

**Caveats**

- `Error` only accepts `DomainError` subclasses: a JavaScript `Error` is a technical failure and is
  thrown.
- `CommandHandler` is an interface: Alveolus provides no bus and no container. Wire handlers in
  your own code.

Import from `@alveolus/core` or `@alveolus/core/command-handlers`.

## See also

- [Query handlers](./query-handlers.md), for requests that only read
- [Event publishers](./event-publishers.md), called after `save`
- [Repositories](../domain/repositories.md), to load and save aggregates
