---
description: "Architecture checks for Domain-Driven Design in TypeScript: alveolus arch check reports every way a project drifts from its layers and bounded contexts."
---

# Rules

`alveolus arch check` applies rules that each report one way a project drifts: a shortcut between
bounded contexts, a framework leaking into the domain, a helper that lands nowhere in particular.

<dl class="al-glance">
	<dt>Command</dt><dd><code>npx alveolus arch check</code></dd>
	<dt>Rule names</dt><dd><a href="#how-rules-are-named"><code>&lt;category&gt;/no-&lt;what it reports&gt;</code></a></dd>
	<dt>Categories</dt><dd><a href="#strategic">Strategic</a>, <a href="#layers">Layers</a>, <a href="#tactical">Tactical</a></dd>
	<dt>Default</dt><dd>Every rule on; test files never checked</dd>
	<dt>Where</dt><dd><a href="#where-a-rule-applies">Every rule on a core context, the boundary rules on a supporting or generic one</a></dd>
	<dt>Config</dt><dd><a href="#turn-a-rule-off"><code>rules</code></a> in <code>alveolus.config.ts</code></dd>
</dl>

## Why

A review catches what a reviewer looks at. The import that crosses a boundary, the class in the
wrong folder or the error thrown instead of returned slip through, one change at a time, and
coding agents make more changes than anyone reviews.

::: tip The fix
Each architecture decision becomes a rule that runs on every change. A violation says where, what
is wrong and what is allowed instead, so a developer or an agent can fix it without knowing the
whole architecture.
:::

## How rules are named

Every rule is named `<category>/no-<what it reports>`: the category says which part of the
architecture it guards, the rest says what a violation is.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><code>strategic/</code></span>Between bounded contexts: what may cross a boundary, and through which door.</div>
<div class="al-card"><span class="al-card-title"><code>layers/</code></span>Inside a bounded context: which layer may depend on which, and what each one may import.</div>
<div class="al-card"><span class="al-card-title"><code>tactical/</code></span>Inside the domain and the application: how building blocks are written and where they live.</div>
</div>

## Where a rule applies

`subdomains` in `alveolus.config.ts` says which bounded contexts are
[core, supporting or generic](../guide/project-layout.md#core-supporting-generic). A core context
and the shared kernel are checked by every rule. A supporting or generic context is checked only
by the rules about its boundary, the `strategic/` and `tooling/` ones: how it is written inside is
its own business. The "Applies to" line of each rule page says which it is.

## Strategic

| Rule | Reports |
| --- | --- |
| [`strategic/no-cross-context-import`](./strategic/no-cross-context-import.md) | An import from another bounded context that is not its open host service, a file the analysis does not see, a composition root that re-exports. |
| [`strategic/no-fat-shared-kernel`](./strategic/no-fat-shared-kernel.md) | An aggregate, a repository or a handler in the shared kernel. |
| [`strategic/no-shared-state`](./strategic/no-shared-state.md) | A static field of the shared kernel that holds state. |
| [`strategic/no-leaky-host-service`](./strategic/no-leaky-host-service.md) | An open host service that exposes a class of its context, receives a function or returns an erased type, instead of speaking the published language. |
| [`strategic/no-unmapped-context`](./strategic/no-unmapped-context.md) | A context consuming one the context map does not allow, or two contexts that depend on each other. |

## Layers

In core bounded contexts and the shared kernel.

| Rule | Reports |
| --- | --- |
| [`layers/no-driving-shortcut`](./layers/no-driving-shortcut.md) | A driving adapter reaching a repository, a port or an aggregate instead of calling a handler. |
| [`layers/no-impure-domain`](./layers/no-impure-domain.md) | The domain importing a framework, a database or another layer. |
| [`layers/no-outward-import`](./layers/no-outward-import.md) | A dependency pointing away from the domain, and a file outside the layers. |
| [`layers/no-portless-adapter`](./layers/no-portless-adapter.md) | A driven adapter that extends no port, a port declared outside the domain. |

## Tactical

In core bounded contexts and the shared kernel.

| Rule | Reports |
| --- | --- |
| [`tactical/no-aggregate-reference`](./tactical/no-aggregate-reference.md) | An aggregate holding another aggregate instead of its identifier, an entity held by two aggregates. |
| [`tactical/no-foreign-command-dependency`](./tactical/no-foreign-command-dependency.md) | A command handler receiving a query repository, another handler or a plain class. |
| [`tactical/no-foreign-query-dependency`](./tactical/no-foreign-query-dependency.md) | A query handler receiving what writes or changes state. |
| [`tactical/no-loose-code`](./tactical/no-loose-code.md) | Code outside a building block in the domain or the application: a plain or static-only class, a class that extends an expression, a function, an enum, a namespace, module state, a computed constant; anything but the module in a composition root. |
| [`tactical/no-misplaced-class`](./tactical/no-misplaced-class.md) | A class in the wrong folder or file, two classes in one file. |
| [`tactical/no-public-field`](./tactical/no-public-field.md) | A public field on an aggregate, an entity, a value object or an identifier. |
| [`tactical/no-stateful-service`](./tactical/no-stateful-service.md) | A domain service holding a port, a repository or another service. |
| [`tactical/no-thrown-failure`](./tactical/no-thrown-failure.md) | A business failure thrown instead of returned. |

## Tooling

| Rule | Reports |
| --- | --- |
| [`tooling/no-loose-disable`](./tooling/no-loose-disable.md) | A disable comment that names no known rule, gives no reason, or disables nothing. |

## Read a violation

Violations are grouped by file. Each one gives the line, the rule, what is wrong and what is allowed
instead:

```
src/ordering/application/commands/place-order.command.ts
  4  error  layers/no-outward-import: The application layer imports
  src/ordering/driven/pg/adapters/mailer.adapter.ts (ordering driven):
  it may only import domain, application, published-language.
```

`--format json` gives the same information as JSON, with the symbol involved, for tools and
agents.

## Building blocks are recognised by inheritance

The rules know what a class is from what it extends: `class Order extends AggregateRoot` is an
aggregate, wherever it is and whatever its name. A class that extends one of your own base classes
counts too, as long as that base class extends a building block of `@alveolus/core`.

::: tip
There are no decorators or naming conventions to learn: the class says what it is, and the rules
take it at its word.
:::

## Every import counts

The rules that check imports read every way a file can depend on another one, not only
`import … from`:

```ts
/// <reference path="../legacy/pool.ts" />
/// <reference types="pg" />
import { Pool } from "pg";
export { Pool } from "pg";
type Pool = import("pg").Pool;
const pg = await import("pg");
const pg = require("pg");
import pg = require("pg");
declare module "pg" { interface Pool { tenant: string } }
```

A global declared by the project, in a `declare global` block, counts as an import of the file that
declares it.

An import the analysis cannot see through counts as a file outside the project: one that does not
resolve, such as a `.js` file without types, one whose path is computed at runtime, or one that is
ignored, such as a test file. No file imports it, not even a composition root or a file at the
root of `src/`: a test file that re-exports another context would otherwise carry the import past
every rule.

Code loaded at runtime counts the same way, wherever it is: `node:module` (`createRequire`),
`node:vm`, `module.require`, `process.getBuiltinModule`, `eval` and the `Function` constructor.
They are recognised by their type as well as by their name: an alias of `Function` or `eval`, the
`constructor` of a function (`(() => 0).constructor`, the `AsyncFunction` constructor),
`Reflect.construct(Function, …)`, and a lookup on `globalThis` whose key is computed, such as
`Reflect.get(globalThis, name)`. To read a JSON file, import it:
`import pkg from "../package.json" with { type: "json" }`.

```
src/ordering/domain/services/pricing.service.ts
  2  error  layers/no-impure-domain: The domain imports
  src/ordering/domain/services/db.spec.ts (ignored by the analysis):
  it may only import the domain.
```

## Set the level of a rule

Every rule reports an `error` by default, and an error fails the check. In `alveolus.config.ts`,
lower a rule to `warn` or `info`, which report without failing, or turn it `off`, with its full
name:

```ts [alveolus.config.ts]
export default defineConfig({
	boundedContexts: { ordering: "ordering" },
	contextMap: { ordering: { consumes: [] } },
	root: "src",
	rules: { "tactical/no-misplaced-class": "off", "tactical/no-public-field": "warn" },
	subdomains: { core: ["ordering"] },
});
```

`warn` and `info` are the way in on an existing project: a rule reports for a while, the team
fixes, then it becomes an error.

To turn one violation off where it stands, with a reason, write a disable comment above the line:
see [Getting started](../guide/getting-started.md#turn-a-violation-off). To adopt the rules on an
existing project without turning them off, record the current violations in a baseline: see
[Getting started](../guide/getting-started.md#adopt-it-on-an-existing-project).

Tests and their companions (`*.spec.ts`, `*.test.ts`, `*.e2e-spec.ts`, `*.fixture.ts`, `*.stories.ts`,
`__tests__/`, `__mocks__/`) are never checked, and production code may not
import them.

## What the rules cannot see

The rules read the code, not what it does at run time: a port whose adapter reads the views, an
interface shaped like an aggregate, or an anti-corruption layer that passes data through untouched
all look right. Each rule page lists its limits in a **Limits** section, with what to watch for in
review. A file that matches `ignore` in `alveolus.config.ts` is not analysed at all: review a
change to `ignore` as you would review a rule turned off.

## See also

- [Getting started](../guide/getting-started.md), to configure and run the checks
- [Project layout](../guide/project-layout.md), the layout the rules keep
