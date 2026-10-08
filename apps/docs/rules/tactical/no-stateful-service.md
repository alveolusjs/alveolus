---
description: "Architecture rule for domain services: a domain service is stateless and holds configuration only, never a port, a repository or another service."
---

# no-stateful-service

A domain service holds configuration only: the command handler passes it what it needs.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-stateful-service</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A domain service that holds a port, a repository, another service or any class other than a value object</dd>
	<dt>Applies to</dt><dd>The constructor parameters and fields of every <code>DomainService</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-stateful-service": "off"</code></a></dd>
</dl>

## Why

`OrderLimit` receives `Orders` to count the orders of a customer. The rule now loads data on its
own, a query handler that uses it can write, and testing it needs a repository. A domain service
is a stateless operation: it is given the aggregates and values it works on.

::: tip The fix
The command handler loads what the rule needs and passes it to the service method. The service
keeps only its configuration, such as a limit or a rate.
:::

## What it checks

Every constructor parameter and every field of each `DomainService`:

| Holds | Allowed |
| --- | --- |
| A plain value such as a `number` or a `string` | ✅ |
| A value object, an identifier | ✅ |
| A class of a package listed in `domainDependencies` | ✅ |
| A `Port`, a `CommandRepository`, a `QueryRepository` | ❌ |
| Another `DomainService`, an aggregate, an entity, a handler | ❌ |
| Any other class of the project | ❌ |

## What it reports

```
src/ordering/domain/services/order-limit.service.ts
  4  error  tactical/no-stateful-service: The DomainService OrderLimit holds
  Orders, a CommandRepository: a domain service holds configuration
  only; the command handler passes it what it needs.
```

## Fix it

### Pass what the rule needs to the method

So that the service stays a pure operation, the command handler loads the data and passes it in.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/services/order-limit.service.ts]
export class OrderLimit extends DomainService {
	constructor(private readonly orders: Orders) {
		super();
	}
}
```

```ts [✅ Prefer: src/ordering/domain/services/order-limit.service.ts]
export class OrderLimit extends DomainService {
	constructor(private readonly maxLinesForNewCustomers: number) {
		super();
	}

	check(order: Order, customer: Customer): Result<void, OrderTooLarge> {
		// …
	}
}
```

</div>

## Limits

::: warning What the rule cannot see
- A port passed to a method of the service, call after call: the rule checks what the service
  holds, not what it receives. In review, a domain service method takes aggregates and values.
- State reached through a module: the service has no field, but reads a constant that holds a
  connection. `tactical/no-loose-code` reports the constant; the rule does not see the read.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-stateful-service": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new services stay stateless while you rework the old ones.

## See also

- [Domain services](../../core/domain/domain-services.md), what is checked
- [Command handlers](../../core/application/command-handlers.md), which load what a service needs
- [Rules](../index.md), every rule by category
