# NestJS

Each bounded context is a NestJS module. Ports and repositories are the injection tokens.

## Register the handlers

A handler has no `@Injectable()`: register it with a factory, listing its constructor tokens in
order.

```ts [src/ordering/ordering.module.ts]
providers: [
	{ provide: Orders, useClass: PgOrders },
	{ provide: Clock, useClass: SystemClock },
	{ provide: IdGenerator, useClass: RandomIdGenerator },
	{
		inject: [Orders, Clock, IdGenerator],
		provide: PlaceOrderHandler,
		useFactory: (orders: Orders, clock: Clock, ids: IdGenerator) => new PlaceOrderHandler(orders, clock, ids),
	},
],
```

Adapters are outside the application: they may carry `@Injectable()`, as `PgOrders` does here.

## Or use `@Injectable()` in the application

To list handlers as plain providers, allow `Injectable`, and only it, in the application:

```ts [alveolus.config.ts]
applicationDependencies: { "@nestjs/common": ["Injectable"] },
```

```ts [src/ordering/application/commands/place-order.command.ts]
@Injectable()
export class PlaceOrderHandler extends CommandHandler<PlaceOrder, void, PlaceOrderError> { … }
```

```ts [src/ordering/ordering.module.ts]
providers: [{ provide: Orders, useClass: PgOrders }, PlaceOrderHandler],
```

::: warning
- The application then depends on NestJS, and needs `emitDecoratorMetadata`: Vitest and other
  esbuild-based tools need a SWC transform.
- Import the injected classes as values, not with `import type`.
:::

## Connect two bounded contexts

A module exports its [open host services](../core/strategic/open-host-services.md), and nothing
else. The downstream module imports it to build its anti-corruption layer.

```ts [src/catalog/catalog.module.ts]
@Module({ exports: [CatalogApi], providers: [CatalogApi, …] })
export class CatalogModule {}
```

```ts [src/ordering/ordering.module.ts]
@Module({ imports: [CatalogModule], providers: [{ provide: PriceList, useClass: CatalogPriceList }, …] })
export class OrderingModule {}
```

## Troubleshooting

**`Nest can't resolve dependencies of PlaceOrderHandler (?, …)`**: the handler is listed as a plain
class without `@Injectable()`, or an injected class is imported with `import type`, or a token of
`inject` has no provider.
