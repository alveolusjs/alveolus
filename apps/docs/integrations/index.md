# Integrations

The domain and the application import no framework: every class receives its dependencies in its
constructor, typed with abstract classes. Only the composition root of each bounded context knows
how to build them, by hand or with a container.

## Without a container

With Express, Fastify, Hono or plain Node.js, the composition root builds everything with `new`:

```ts [src/ordering/ordering.module.ts]
export class OrderingModule {
	readonly placeOrder: PlaceOrderHandler;

	constructor(db: Pool) {
		this.placeOrder = new PlaceOrderHandler(new PgOrders(db), new SystemClock(), new RandomIdGenerator());
	}
}
```

Routes, consumers and jobs then call `handle` and map the `Result`: see
[Command handlers](../core/application/command-handlers.md#call-it-from-a-driving-adapter).

## With a container

The abstract classes of your ports and repositories are the injection tokens: register each
adapter under its port. See [NestJS](./nestjs.md).

## See also

- [Project layout: composition root](../guide/project-layout.md#composition-root)
- [`layer-direction`](../rules/layer-direction.md), which keeps frameworks out of the application
