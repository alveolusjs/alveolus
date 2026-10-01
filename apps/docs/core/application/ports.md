# Ports

A port is a capability the application needs from the outside world: a clock, an identifier
generator, a mailer, a payment gateway. The application declares it as an interface; a driven
adapter implements it.

```ts
export interface Clock extends Port {
	now(): Date;
}
```

## When to use

Declare a port for every technical dependency of a use case, so that the application never calls
infrastructure directly and tests can replace it. Loading and saving aggregates goes through
[repositories](../domain/repositories.md), reading views through
[view repositories](../domain/views.md), and publishing events through
[event publishers](./event-publishers.md) and [notifications](./notifications.md).

## Usage

### Declare a port

Extend `Port` with the methods the application needs, in `application/ports/`. A port used by every
bounded context, such as the clock, goes in the shared kernel.

```ts [src/shared-kernel/application/ports/clock.port.ts]
import type { Port } from "@alveolus/core";

export interface Clock extends Port {
	now(): Date;
}
```

```ts [src/ordering/application/ports/payment-gateway.port.ts]
import type { Port } from "@alveolus/core";

export interface PaymentGateway extends Port {
	charge(orderId: string, amount: number): Promise<void>;
}
```

### Use it in a handler

The handler receives the port in its constructor and never knows the adapter.

```ts
export class PlaceOrderHandler implements CommandHandler<PlaceOrder, void, PlaceOrderError> {
	constructor(
		private readonly orders: OrderRepository,
		private readonly clock: Clock,
	) {}
}
```

### Implement it

The adapter lives in `driven/`.

```ts [src/shared-kernel/driven/system-clock.ts]
export class SystemClock implements Clock {
	now(): Date {
		return new Date();
	}
}
```

## Reference

```ts
interface Port
```

`Port` has no member: it marks the interface as a port, so that `alveolus arch check` finds it and
its adapters.

Import from `@alveolus/core` or `@alveolus/core/ports`.

## See also

- [Command handlers](./command-handlers.md), which receive ports
- [Project layout](/arch/project-layout), the `port/*` rules
