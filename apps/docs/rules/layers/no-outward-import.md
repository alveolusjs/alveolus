# no-outward-import

Every dependency points towards the domain, only the composition root sees every layer, and every
file belongs to a layer.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>layers/no-outward-import</code></dd>
	<dt>Category</dt><dd><a href="/rules/#layers">Layers</a>: what each layer may depend on</dd>
	<dt>Reports</dt><dd>An import that points away from the domain, a package the application may not use, a file outside the layers</dd>
	<dt>Applies to</dt><dd><code>application/</code>, <code>published-language/</code>, <code>driven/</code>, <code>driving/</code>, composition roots and files at the root of <code>src/</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"layers/no-outward-import": "off"</code></a></dd>
</dl>

## Why

The `PlaceOrderHandler` imports `PgOrders` to save the order, and a controller imports the mailer
adapter to send a confirmation. Replacing the database now means rewriting use cases, and a
controller has started sending emails.

::: tip The fix
Every arrow points inwards. The application knows the domain and its ports, never an adapter; each
adapter knows the application, never the adapters on the other side. The composition root is the
one place that knows how everything fits, so each layer can be replaced, tested and read on its
own.
:::

## What it checks

### Imports between layers

Within the same context, or towards the shared kernel:

| From | May import |
| --- | --- |
| `application/` | `domain/`, `application/`, its own `published-language/`. Packages: `@alveolus/core`, `domainDependencies`, `applicationDependencies`. |
| `published-language/` | Its own `published-language/`. From `@alveolus/core`, only `PublishedLanguage`, `IntegrationEvent` and `JsonValue`; other packages, such as a schema library, are fine. |
| `driven/` | `domain/`, `application/`, `published-language/`, `driven/`, any package. |
| `driving/` | `domain/`, `application/`, `published-language/`, `driving/`, any package. |
| the composition root | Anything in its context and in the shared kernel. |
| files at the root of `src/` | Composition roots, and each other. |

No layer imports a composition root. The domain has its own rule,
[`layers/no-impure-domain`](./no-impure-domain.md); imports from another context are checked by
[`strategic/no-cross-context-import`](../strategic/no-cross-context-import.md).

### Files outside the layers

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title">Inside a context</span>A file directly in a context that is not its composition root belongs to no layer.</div>
<div class="al-card"><span class="al-card-title">Outside every context</span>A file under <code>src/</code>, outside every declared context and the shared kernel, and not at the root.</div>
</div>

## What it reports

```
src/ordering/application/commands/place-order.command.ts:1
  layers/no-outward-import: The application imports
  @nestjs/common: add it to applicationDependencies if the
  application really needs it.

src/ordering/application/commands/place-order.command.ts:3
  layers/no-outward-import: The application layer imports
  src/ordering/driven/pg/adapters/pg-orders.adapter.ts
  (ordering driven): it may only import domain, application,
  published-language.

src/ordering/helpers.ts:1
  layers/no-outward-import: The file is outside the layers:
  move it to domain/, application/, published-language/,
  driven/ or driving/.
```

The rule also reports:

| Case | Message |
| --- | --- |
| A layer imports a composition root | `Imports … : only the composition root wires the layers.` |
| A file at the root imports inside a context | `Files at the root import composition roots only, not ….` |
| The published language imports another name from core | `The published language imports … from @alveolus/core: only published-language types are allowed.` |
| A name not allowed from a restricted package | `The application imports Controller from @nestjs/common: applicationDependencies only allows Injectable.` |
| A file outside the declared contexts | `The file is outside the bounded contexts and the shared kernel declared in alveolus.config.ts: move it, or add it to ignore.` |

## Fix it

### Depend on the port, not on the adapter

So that replacing the database touches no use case, the handler receives the repository it
extends from the domain, and the composition root passes it the adapter.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/application/commands/place-order.command.ts]
import { Controller } from "@nestjs/common";

import { PgOrders } from "../../driven/pg/adapters/pg-orders.adapter";
```

```ts [✅ Prefer: src/ordering/application/commands/place-order.command.ts]
import { CommandHandler } from "@alveolus/core";

import { Orders } from "../../domain/repositories/orders.repository";
```

</div>

### Give every file a layer

So that every file has a known place, move a helper into the layer that uses it, as a building
block. A file that has nothing to do with the architecture, such as a script, can be left out with
`ignore` in `alveolus.config.ts`.

## Allow a package

The application imports no framework: the composition root builds its classes. A package it really
needs is declared, with `true` to allow everything it exports, or with the names you allow:

```ts [alveolus.config.ts]
export default defineConfig({
	applicationDependencies: {
		"@nestjs/common": ["Injectable"],
		zod: true,
	},
	boundedContexts: { ordering: "ordering" },
	root: "src",
});
```

The packages of `domainDependencies` are allowed in the application too.

## Turn it off

```ts [alveolus.config.ts]
rules: { "layers/no-outward-import": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new code keeps the arrows inwards while you fix the old ones.

## See also

- [Project layout: who may import what](../../guide/project-layout.md#who-may-import-what)
- [Integrations](../../integrations/index.md), to build the classes in the composition root
- [`layers/no-impure-domain`](./no-impure-domain.md), the same idea for the domain
- [Rules](../index.md), every rule by category
