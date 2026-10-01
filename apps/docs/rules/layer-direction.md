# layer-direction

Every dependency points towards the domain. Adapters depend on the application, the application
on the domain, and only the composition root sees everything. Every file also belongs to a layer.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/application/commands/place-order.command.ts]
import { Controller } from "@nestjs/common";

import { PgOrders } from "../../driven/pg/adapters/pg-orders.adapter";
```

```ts [✅ Prefer: src/ordering/application/commands/place-order.command.ts]
import { CommandHandler } from "@alveolus/core";
import { Injectable } from "@nestjs/common";

import { Orders } from "../../domain/repositories/orders.repository";
```

</div>

## What it checks

Imports between layers of the same context, or towards the shared kernel:

| From | May import |
| --- | --- |
| `application/` | `domain/`, `application/`, its own `published-language/`. Packages: `@alveolus/core`, `Injectable` from `@nestjs/common`, `domainDependencies`. |
| `published-language/` | Its own `published-language/`. From `@alveolus/core`, only `PublishedLanguage`, `IntegrationEvent` and `JsonValue`; other packages, such as a schema library, are fine. |
| `driven/` | `domain/`, `application/`, `published-language/`, `driven/`, any package. |
| `driving/` | `domain/`, `application/`, `published-language/`, `driving/`, any package. |
| the composition root | Anything in its context and in the shared kernel. |
| files at the root of `src/` | Composition roots, and each other. |

No layer imports a composition root. The domain has its own rule,
[`domain-purity`](./domain-purity.md); imports from another context are checked by
[`bc-isolation`](./bc-isolation.md).

The rule also reports files that belong to no layer: a file directly in a context that is not its
composition root, or a file under `src/` outside every declared context and the shared kernel.

## Why

When the application imports an adapter, replacing the database means rewriting use cases. When a
driving adapter imports a driven one, a controller starts sending emails. Keeping every arrow
inwards means each layer can be replaced, tested and read on its own, and the composition root is
the one place that knows how everything fits.

## What it reports

```
src/ordering/application/commands/place-order.command.ts:1
  layer-direction: The application imports Controller from @nestjs/common: only Injectable is allowed.

src/ordering/application/commands/place-order.command.ts:3
  layer-direction: The application layer imports src/ordering/driven/pg/adapters/pg-orders.adapter.ts (ordering driven): it may only import domain, application, published-language.

src/ordering/helpers.ts:1
  layer-direction: The file is outside the layers: move it to domain/, application/, published-language/, driven/ or driving/.
```

A file that has nothing to do with the architecture, such as a script, can be left out with
`ignore` in `alveolus.config.ts`.

## Turn it off

```ts
rules: { "layer-direction": "off" }
```

## See also

- [Project layout: who may import what](../guide/project-layout.md#who-may-import-what)
- [`domain-purity`](./domain-purity.md)
