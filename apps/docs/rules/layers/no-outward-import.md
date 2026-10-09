---
description: "Architecture rule: every dependency points towards the domain, as in hexagonal and clean architecture, and only the composition root sees every layer."
---

# no-outward-import

Every dependency points towards the domain, only the composition root sees every layer, and every
file belongs to a layer.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>layers/no-outward-import</code></dd>
	<dt>Category</dt><dd><a href="/rules/#layers">Layers</a>: what each layer may depend on</dd>
	<dt>Reports</dt><dd>An import that points away from the domain, a package the application may not use, a file outside the layers or in the wrong folder of its layer</dd>
	<dt>Applies to</dt><dd><code>application/</code>, <code>published-language/</code>, <code>driven/</code>, <code>driving/</code>, composition roots and files at the root of <code>src/</code>; in core bounded contexts and the shared kernel</dd>
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

Every form of import counts, see [Every import counts](../index.md#every-import-counts).

### Files outside the layers

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title">Inside a context</span>A file directly in a context that is not its composition root belongs to no layer. A context, or a feature of the shared kernel, has a single composition root.</div>
<div class="al-card"><span class="al-card-title">Outside every context</span>A file under <code>src/</code>, outside every declared context and the shared kernel, and not at the root.</div>
</div>

The layer is the first folder of a context, or the second one in a feature of the shared kernel:
`ordering/legacy/domain/` is no layer.

### Folders inside a layer

Each layer expects the folders of the [project layout](../../guide/project-layout.md#the-tree).
A file in another folder keeps its layer for every other rule, and is reported here. A folder of
your own goes in `layout.extraFolders` of `alveolus.config.ts`: `{ domain: ["specifications"] }`.

| Layer | Expected | Reported |
| --- | --- | --- |
| `domain/` | One folder of a kind: `aggregates/`, `entities/`, `value-objects/`, `events/`, `errors/`, `services/`, `repositories/`, `ports/`, `views/` | A file directly in `domain/`, a deeper folder, another folder name |
| `application/` | One folder of a kind: `commands/`, `queries/`, `translators/` | The same |
| `published-language/` | The files directly | Any folder |
| `driven/` | `<technology>/<folder>/`, such as `pg/adapters/` | A file without a technology, a deeper folder |
| `driving/` | `<technology>/`, any folders below, such as `http/controllers/` | A file without a technology |

## What it reports

```
src/ordering/application/commands/place-order.command.ts
  1  error  layers/no-outward-import: The application imports
  @nestjs/common: add it to applicationDependencies if the
  application really needs it.
  3  error  layers/no-outward-import: The application layer imports
  src/ordering/driven/pg/adapters/pg-orders.adapter.ts
  (ordering driven): it may only import domain, application,
  published-language.

src/ordering/helpers.ts
  1  error  layers/no-outward-import: The file is outside the layers:
  move it to domain/, application/, published-language/,
  driven/ or driving/.

src/ordering/domain/legacy/v1/aggregates/order.aggregate.ts
  1  error  layers/no-outward-import: The file is nested too deep: domain/
  holds one folder per kind, such as domain/aggregates/.
```

The rule also reports:

| Case | Message |
| --- | --- |
| A layer imports a composition root | `Imports … : only the composition root wires the layers.` |
| A file at the root imports inside a context | `Files at the root import composition roots only, not ….` |
| Two composition roots in a context | `ordering has 2 composition roots (ordering.module.ts, pricing.module.ts): keep one, and move the rest into the layers.` |
| The published language imports another name from core | `The published language imports … from @alveolus/core: only published-language types are allowed.` |
| A name not allowed from a restricted package | `The application imports Controller from @nestjs/common: applicationDependencies only allows Injectable.` |
| A file outside the declared contexts | `The file is outside the bounded contexts and the shared kernel declared in alveolus.config.ts: move it, or add it to ignore.` |
| A file directly in `domain/` or `application/` | `The file sits directly in domain/: put it in the folder of its kind, such as domain/aggregates/.` |
| A folder that is no kind | `domain/helpers/ is no folder of the domain: use aggregates/, entities/, …` |
| An adapter without a technology | `The file is not under a technology: driven/ holds driven/<technology>/<folder>/, such as driven/pg/adapters/.` |

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

### Give every file a layer and a folder

So that every file has a known place, move a helper into the layer that uses it, as a building
block, in the folder of its kind. A barrel such as `domain/index.ts` is not needed: import each
file from its folder. A file that has nothing to do with the architecture, such as a script, can be left out with
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

## Limits

::: warning What the rule cannot see
- Below its technology, an adapter layer may hold any folder: `driving/http/controllers/v1/` is
  fine. What those folders contain is checked by
  [`tactical/no-loose-code`](../tactical/no-loose-code.md): classes only.
- A file that matches `ignore` in `alveolus.config.ts` is not analysed at all. Review a change to
  `ignore` as you would review a rule turned off.
:::

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
