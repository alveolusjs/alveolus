---
description: "Domain-Driven Design with NestJS: each bounded context is a NestJS module, and the abstract classes of ports and repositories are its injection tokens."
---

# NestJS

Each bounded context is a NestJS module, and the abstract classes of ports and repositories are its
injection tokens.

<dl class="al-glance">
	<dt>Bounded context</dt><dd>One <code>@Module</code>, in <code>ordering.module.ts</code></dd>
	<dt>Tokens</dt><dd>The abstract classes of ports and repositories</dd>
	<dt>Handlers</dt><dd><a href="#register-the-handlers">A factory provider</a>, or <a href="#or-use-injectable-in-the-application"><code>@Injectable()</code></a> if you allow it</dd>
	<dt>Exports</dt><dd><a href="#connect-two-bounded-contexts">Open host services</a> only</dd>
	<dt>Checked by</dt><dd><a href="/rules/layers/no-outward-import"><code>layers/no-outward-import</code></a>, <a href="/rules/strategic/no-cross-context-import"><code>strategic/no-cross-context-import</code></a></dd>
</dl>

## Why

NestJS invites a decorator on every class. On a handler, `@Injectable()` makes the application
import `@nestjs/common`: the use cases then depend on the framework, and the build needs
`emitDecoratorMetadata`.

::: tip The fix
Keep NestJS in the module and the adapters. The module registers each adapter under its abstract
class and builds each handler with a factory. The application imports nothing from NestJS.
:::

## Design it

### Choose how to register the handlers

| If you want… | Then register handlers… |
| --- | --- |
| an application free of NestJS, built by any tool | with a [**factory**](#register-the-handlers): the default |
| shorter modules, and accept the framework in the application | as [**`@Injectable()` classes**](#or-use-injectable-in-the-application) |

Adapters are outside the application: they may carry `@Injectable()` either way.

## Usage

### Register the handlers

A handler has no `@Injectable()`, so NestJS cannot read its constructor: register it with a
factory, listing its constructor tokens in order.

```ts [src/ordering/ordering.module.ts]
providers: [
	{ provide: Orders, useClass: PgOrders },
	{ provide: Clock, useClass: SystemClock },
	{ provide: IdGenerator, useClass: RandomIdGenerator },
	{
		inject: [Orders, Clock, IdGenerator],
		provide: PlaceOrderHandler,
		useFactory: (orders: Orders, clock: Clock, ids: IdGenerator) =>
			new PlaceOrderHandler(orders, clock, ids),
	},
],
```

`PgOrders` is a driven adapter: it may carry `@Injectable()` to receive the database client.

### Or use `@Injectable()` in the application

To list handlers as plain providers, allow `Injectable`, and only it, in the application:

```ts [alveolus.config.ts]
applicationDependencies: { "@nestjs/common": ["Injectable"] },
```

```ts [src/ordering/application/commands/place-order.command.ts]
@Injectable()
export class PlaceOrderHandler extends CommandHandler<
	PlaceOrder,
	void,
	PlaceOrderError
> { … }
```

```ts [src/ordering/ordering.module.ts]
providers: [{ provide: Orders, useClass: PgOrders }, PlaceOrderHandler],
```

::: warning Caveats
- The application then depends on NestJS, and needs `emitDecoratorMetadata`: Vitest and other
  esbuild-based tools need a SWC transform.
- Import the injected classes as values, not with `import type`: the metadata needs them at
  runtime.
:::

### Connect two bounded contexts

So that nothing else of the catalog leaks out, a module exports its
[open host services](../core/strategic/open-host-services.md), and nothing else. The downstream
module imports it to build its [anti-corruption layer](../core/strategic/anti-corruption-layers.md).

```ts [src/catalog/catalog.module.ts]
@Module({
	exports: [CatalogApi],
	providers: [CatalogApi, …],
})
export class CatalogModule {}
```

```ts [src/ordering/ordering.module.ts]
@Module({
	imports: [CatalogModule],
	providers: [{ provide: PriceList, useClass: CatalogPriceList }, …],
})
export class OrderingModule {}
```

Exporting a repository or a handler would let another context reach the model behind the open host
service. Checked by [`strategic/no-cross-context-import`](../rules/strategic/no-cross-context-import.md).

### Answer with a `Result`

So that a controller stays a translation, it calls the handler, and maps the `Result` to a
response: a success to the status code, a failure to the HTTP error the client can act on. The
mapping lives once, in an exception filter or a small mapper class of `driving/http/`.

```ts [src/ordering/driving/http/orders.controller.ts]
@Controller("orders")
export class OrdersController {
	constructor(private readonly placeOrder: PlaceOrderHandler) {}

	@Post(":id/place")
	async place(@Param("id") id: string): Promise<void> {
		const result = await this.placeOrder.handle({ orderId: id });
		if (!result.ok) {
			throw new HttpFailure(result.error);
		}
	}
}
```

`HttpFailure` is a class of `driving/http/` that turns a `DomainError` into an `HttpException`
by its `type`: `EmptyOrder` to `422`, `OrderNotFound` to `404`. The domain never knows HTTP.

### Run the check with your lint

So that a violation is seen before the review, the check runs where the lint runs:

```json [package.json]
{
	"scripts": {
		"lint": "biome check . && alveolus arch check",
		"lint:arch": "alveolus arch check --format sarif > arch.sarif"
	}
}
```

In CI, `alveolus arch check` fails the job on an error; `--format sarif` and
`github/codeql-action/upload-sarif` put each violation on the line it concerns in the pull
request.

## Troubleshooting

**`Nest can't resolve dependencies of PlaceOrderHandler (?, …)`**: the handler is listed as a plain
class without `@Injectable()`, an injected class is imported with `import type`, or a token of
`inject` has no provider.

## See also

- [Integrations](./index.md), the composition root without a framework
- [Command handlers](../core/application/command-handlers.md), the classes the module builds
- [Open host services](../core/strategic/open-host-services.md) and
  [Anti-corruption layers](../core/strategic/anti-corruption-layers.md), to connect two modules
- Rules: [`layers/no-outward-import`](../rules/layers/no-outward-import.md), [`strategic/no-cross-context-import`](../rules/strategic/no-cross-context-import.md)
