# domain-purity

The domain depends on nothing but itself. It imports its own domain, the domain of the shared
kernel and the domain building blocks of `@alveolus/core`: no framework, no ORM, no other layer.

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

## What it checks

Every import of a file in `domain/`, in a bounded context or in the shared kernel:

| Import | Allowed when |
| --- | --- |
| A file of the project | It is in the `domain/` of the same context or of the shared kernel. |
| `@alveolus/core` | Every imported name is a domain building block or part of `Result`: `AggregateRoot`, `Entity`, `ValueObject`, `Identifier`, `DomainEvent`, `DomainError`, `DomainService`, `Port`, `Clock`, `IdGenerator`, `CommandRepository`, `QueryRepository`, `View`, `Result`, `ok`, `err`, `map`, `mapErr`, `andThen`, `combine` and their `Any…` types. |
| Any other package | It is listed in `domainDependencies`; when its entry lists names, every imported name is one of them. |

Importing from the root `@alveolus/core` is fine: the rule checks each imported name, not the path.

## Why

The domain holds the business rules: they should change when the business does, not when a
library does. A domain that imports nothing technical runs and is tested without a database, a
clock or a framework, and survives a change of any of them.

## Allow a package

Some packages belong in a domain, such as a decimal library for money. Declare them, with `true`
to allow everything they export, or with the names you allow:

```ts [alveolus.config.ts]
export default defineConfig({
	boundedContexts: { ordering: "ordering" },
	domainDependencies: { "date-fns": ["addDays", "isBefore"], "decimal.js": true },
	root: "src",
});
```

Importing another name from a restricted package is reported:
`The domain imports format from date-fns: domainDependencies only allows addDays, isBefore.`

The application may use them too.

## What it reports

```
src/ordering/domain/aggregates/order.aggregate.ts:1
  domain-purity: The domain imports @nestjs/common: add it to domainDependencies if the domain really needs it.

src/ordering/domain/aggregates/order.aggregate.ts:2
  domain-purity: The domain imports UnitOfWork from @alveolus/core: only domain building blocks and Result are allowed.

src/ordering/domain/aggregates/order.aggregate.ts:5
  domain-purity: The domain imports src/ordering/driven/smtp/adapters/mailer.adapter.ts (ordering driven): it may only import the domain.
```

## Turn it off

```ts
rules: { "domain-purity": "off" }
```

## See also

- [`layer-direction`](./layer-direction.md), the same idea for the other layers
- [Project layout: layers](../guide/project-layout.md#layers)
