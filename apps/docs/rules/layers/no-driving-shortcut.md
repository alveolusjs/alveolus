---
description: "Architecture rule: a driving adapter calls the command and query handlers, and never reaches a repository, a port or an aggregate of the domain itself."
---

# no-driving-shortcut

A driving adapter calls the command and query handlers: it never reaches a repository, a port, an
aggregate or a domain service itself.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>layers/no-driving-shortcut</code></dd>
	<dt>Category</dt><dd><a href="/rules/#layers">Layers</a>: what each layer may depend on</dd>
	<dt>Reports</dt><dd>A file of <code>driving/</code> that imports a <code>CommandRepository</code>, a <code>QueryRepository</code>, a <code>Port</code>, an <code>AggregateRoot</code>, an <code>Entity</code> or a <code>DomainService</code></dd>
	<dt>Applies to</dt><dd>Every file in <code>driving/</code>, in every bounded context and the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"layers/no-driving-shortcut": "off"</code></a></dd>
</dl>

## Why

`OrdersController` injects `Orders`, loads the order, calls `place()` and saves it: the use case
now lives in the controller. The next entry point, a message consumer, copies those lines; the
transaction, the outbox and the events that `PlaceOrderHandler` handles are skipped, and the
rules that `no-foreign-command-dependency` keeps on handlers do not apply to a controller.

::: tip The fix
A driving adapter translates a request into a command or a query, calls its handler, and
translates the `Result` into a response. The use case exists once, in the application.
:::

## What it checks

Every import of a file in `driving/` that points to a file of the project:

| Imported class | Allowed |
| --- | --- |
| A `CommandHandler`, a `QueryHandler`, an `EventTranslator` | ✅ |
| A value object, an identifier, a domain error, a view, a representation | ✅ |
| A `CommandRepository`, a `QueryRepository`, a `Port` | ❌ |
| An `AggregateRoot`, an `Entity`, a `DomainService` | ❌ |

A class counts by what it extends: `Orders` extends `CommandRepository<Order>`. `import type`
counts too, since a dependency injected by type is a dependency. Every form of import counts, see
[Every import counts](../index.md#every-import-counts).

## What it reports

```
src/ordering/driving/http/orders.controller.ts
  3  error  layers/no-driving-shortcut: Imports Orders, a CommandRepository:
     a driving adapter calls the command and query handlers, never
     the ports, repositories or aggregates of the domain.
```

## Fix it

### Call the handler

So that the use case exists once, the controller receives the handler and passes it a command.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/driving/http/orders.controller.ts]
export class OrdersController {
	constructor(private readonly orders: Orders) {}

	async place(id: string): Promise<void> {
		const order = await this.orders.findById(new OrderId(id));
		order?.place();
		await this.orders.save(order);
	}
}
```

```ts [✅ Prefer: src/ordering/driving/http/orders.controller.ts]
export class OrdersController {
	constructor(private readonly placeOrder: PlaceOrderHandler) {}

	async place(id: string): Promise<void> {
		const result = await this.placeOrder.handle({ orderId: id });
		if (!result.ok) {
			throw new BadRequestException(result.error.type);
		}
	}
}
```

</div>

### Read through a query

So that a read goes through the same door, a controller that needs data calls a
[query handler](../../core/application/query-handlers.md), never a query repository.

## Limits

::: warning What the rule cannot see
- A handler injected and then bypassed: the controller may still receive a repository through a
  framework token (`@Inject("ORDERS")`) typed as `unknown`. In review, a driving adapter has no
  provider but handlers.
- What the driving adapter does with a value object or an error: those stay importable to map
  requests and responses.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "layers/no-driving-shortcut": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new entry points go through the handlers while you move the old use cases out of the controllers.

## See also

- [Command handlers](../../core/application/command-handlers.md) and
  [Query handlers](../../core/application/query-handlers.md), what a driving adapter calls
- [`layers/no-outward-import`](./no-outward-import.md), what each layer may import
- [Project layout: layers](../../guide/project-layout.md#layers)
- [Rules](../index.md), every rule by category
