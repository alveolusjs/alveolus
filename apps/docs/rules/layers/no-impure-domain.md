# no-impure-domain

The domain depends on nothing but itself: its own domain, the domain of the shared kernel and the
domain building blocks of `@alveolus/core`.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>layers/no-impure-domain</code></dd>
	<dt>Category</dt><dd><a href="/rules/#layers">Layers</a>: what each layer may depend on</dd>
	<dt>Reports</dt><dd>The domain importing a framework, a database, another layer or a package not allowed</dd>
	<dt>Applies to</dt><dd>Every file in <code>domain/</code>, in every bounded context and the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"layers/no-impure-domain": "off"</code></a></dd>
</dl>

## Why

The `Order` aggregate carries TypeORM decorators so that it can be saved as is, and calls a mailer
when it is placed. Upgrading the ORM now means touching the business rules, and testing that an
empty order is refused needs a database and an SMTP server.

::: tip The fix
The domain imports nothing technical. Storage and email are [ports](../../core/domain/ports.md)
declared by the domain and implemented by driven adapters. The business rules change when the
business does, not when a library does, and run in a test without any infrastructure.
:::

## What it checks

Every import of a file in `domain/`, in a bounded context or in the shared kernel:

| Import | Allowed when |
| --- | --- |
| A file of the project | It is in the `domain/` of the same context or of the shared kernel. |
| `@alveolus/core` | Every imported name is a domain building block or part of `Result`: `AggregateRoot`, `Entity`, `ValueObject`, `Identifier`, `DomainEvent`, `DomainError`, `DomainService`, `Port`, `Clock`, `IdGenerator`, `CommandRepository`, `QueryRepository`, `View`, `Result`, `ok`, `err`, `map`, `mapErr`, `andThen`, `combine` and their `Any…` types. |
| Any other package | It is listed in `domainDependencies`; when its entry lists names, every imported name is one of them. |

Importing from the root `@alveolus/core` is fine: the rule checks each imported name, not the path.

## What it reports

```
src/ordering/domain/aggregates/order.aggregate.ts:1
  layers/no-impure-domain: The domain imports @nestjs/common:
  add it to domainDependencies if the domain really needs it.

src/ordering/domain/aggregates/order.aggregate.ts:2
  layers/no-impure-domain: The domain imports UnitOfWork from
  @alveolus/core: only domain building blocks and Result are allowed.

src/ordering/domain/aggregates/order.aggregate.ts:5
  layers/no-impure-domain: The domain imports
  src/ordering/driven/smtp/adapters/mailer.adapter.ts
  (ordering driven): it may only import the domain.
```

A name not allowed from a restricted package is reported as well:

```
  layers/no-impure-domain: The domain imports format from date-fns:
  domainDependencies only allows addDays, isBefore.
```

## Fix it

### Keep infrastructure behind a port

So that the business rules survive a change of database, framework or mail provider, the domain
declares what it needs as a port, and a driven adapter implements it. Transactions belong to the
command handler, not to the domain.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/aggregates/order.aggregate.ts]
import { Injectable } from "@nestjs/common";
import { AggregateRoot, UnitOfWork } from "@alveolus/core";
import { Column, Entity } from "typeorm";

import { Mailer } from "../../driven/smtp/adapters/mailer.adapter";
```

```ts [✅ Prefer: src/ordering/domain/aggregates/order.aggregate.ts]
import { AggregateRoot, err, ok, type Result } from "@alveolus/core";

import { Money } from "../../../shared-kernel/domain/value-objects/money.value-object";
import { InvalidTotal } from "../errors/invalid-total.error";
```

</div>

### Map storage outside the domain

So that the aggregate is not shaped by its table, it exposes a snapshot, and the repository
adapter maps that snapshot to its storage. See [Aggregates](../../core/domain/aggregates.md).

## Allow a package

Some packages belong in a domain, such as a decimal library for money. Declare them, with `true`
to allow everything they export, or with the names you allow:

```ts [alveolus.config.ts]
export default defineConfig({
	boundedContexts: { ordering: "ordering" },
	domainDependencies: {
		"date-fns": ["addDays", "isBefore"],
		"decimal.js": true,
	},
	root: "src",
});
```

The packages of `domainDependencies` are allowed in the application too.

## Turn it off

```ts [alveolus.config.ts]
rules: { "layers/no-impure-domain": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new code keeps the domain pure while you clean up the old one.

## See also

- [Project layout: layers](../../guide/project-layout.md#layers)
- [Ports](../../core/domain/ports.md), to reach infrastructure from the domain
- [`layers/no-outward-import`](./no-outward-import.md), the same idea for the other layers
- [Rules](../index.md), every rule by category
