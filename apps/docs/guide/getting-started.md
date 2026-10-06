---
description: "Install @alveolus/core and @alveolus/arch, write your first aggregate in TypeScript and check your Domain-Driven Design architecture with alveolus arch check."
---

# Getting started

Alveolus comes as two packages: `@alveolus/core`, the building blocks your code extends, and
`@alveolus/arch`, the command that checks your project keeps the architecture.

<dl class="al-glance">
	<dt>Runtime</dt><dd>Node.js 24 or later, ES modules or CommonJS</dd>
	<dt>TypeScript</dt><dd><code>"module": "node20"</code> or <code>"nodenext"</code>, no decorator</dd>
	<dt>Packages</dt><dd><code>@alveolus/core</code> as a dependency, <code>@alveolus/arch</code> as a development dependency</dd>
	<dt>Config</dt><dd><a href="#configure-the-checks"><code>alveolus.config.ts</code></a>, at the root of the project</dd>
	<dt>Command</dt><dd><a href="#run-the-checks"><code>npx alveolus arch check</code></a></dd>
</dl>

::: warning
Alveolus is in alpha: the API may change between versions until 1.0.
:::

::: tip New to DDD?
The [learning path](./learning-path.md) gives the order in which to read the docs.
:::

## In four steps

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#install">Install</a></span>Add the building blocks to your code and the checks to your development tools.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#use-the-building-blocks">Extend a building block</a></span>Each class of your domain and application says what it is by extending one.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#configure-the-checks">Describe your contexts</a></span>Tell the checks where the code is and which folders are bounded contexts.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#run-the-checks">Run the checks</a></span>In your terminal while you code, and in continuous integration on every change.</div>
</div>

## Prerequisites

The packages are ES modules described by an `exports` map, so TypeScript must resolve packages the
way Node.js does. Node.js 24 also loads them from a CommonJS application, such as a default NestJS
one.

```json [tsconfig.json]
{
	"compilerOptions": {
		"module": "node20"
	}
}
```

`"nodenext"` works as well. No decorator and no `emitDecoratorMetadata` are needed: the building
blocks are plain classes, wired by hand or by your framework. See
[Integrations](../integrations/index.md).

## Install

`@alveolus/core` ends up in your domain: it is a dependency. `@alveolus/arch` only checks the
code: it is a development dependency.

::: code-group

```sh [pnpm]
pnpm add @alveolus/core
pnpm add -D @alveolus/arch
```

```sh [npm]
npm install @alveolus/core
npm install -D @alveolus/arch
```

```sh [yarn]
yarn add @alveolus/core
yarn add -D @alveolus/arch
```

```sh [bun]
bun add @alveolus/core
bun add -d @alveolus/arch
```

:::

`@alveolus/core` has no runtime dependency.

## Use the building blocks

Every building block is an abstract class. Import the one you need from `@alveolus/core` and
extend it: the class then says what it is, to the reader and to the checks.

```ts [src/ordering/domain/value-objects/order-id.identifier.ts]
// [!code word:Identifier]
import { Identifier } from "@alveolus/core";

export class OrderId extends Identifier<string, "OrderId"> {}
```

Each building block also has its own entry point, such as `@alveolus/core/aggregates` or
`@alveolus/core/result`. Both forms give the same classes.

::: tip Where to start
Start from a use case: the [aggregate](../core/domain/aggregates.md) that keeps its rules, then the
[command handler](../core/application/command-handlers.md) that calls it. The
[building blocks](../core/index.md) overview shows how they fit together.
:::

## Configure the checks

Create `alveolus.config.ts` at the root of the project. It says where the source code is and which
folders are bounded contexts; everything else has a default.

```ts [alveolus.config.ts]
import { defineConfig } from "@alveolus/arch";

export default defineConfig({
	boundedContexts: { catalog: "catalog", ordering: "ordering" },
	root: "src",
});
```

### Options

| Option | Default | What it does |
| --- | --- | --- |
| `root` | required | The source folder. |
| `boundedContexts` | required | Each bounded context and its folder, relative to `root`. `"modules/ordering"` works. |
| `sharedKernel` | `"shared-kernel"` | The folder shared by every bounded context, relative to `root`. |
| `compositionRoot` | `"*.module.ts"` | The file, at the root of a bounded context, that wires it. |
| `domainDependencies` | `{}` | npm packages the domain may import, besides `@alveolus/core`. |
| `applicationDependencies` | `{}` | npm packages the application may import, besides `@alveolus/core` and `domainDependencies`. |
| `ignore` | test files | More files to leave out, as globs from the project folder. |
| `rules` | every rule on | Turns a rule off: `{ "tactical/no-misplaced-class": "off" }`. |

`domainDependencies` and `applicationDependencies` take `true` for every name of a package, or the
list of names allowed:

```ts
domainDependencies: { "decimal.js": true, "date-fns": ["addDays"] },
```

`*.spec.ts`, `*.test.ts` and `__tests__/` are always left out, whatever `ignore` says.

## Run the checks

```sh
npx alveolus arch check
```

On a project that keeps the rules, the command prints `No violation` and exits with code 0.
Otherwise it lists each violation, with what is allowed instead, and exits with code 1:

```
src/ordering/domain/aggregates/order.aggregate.ts:1
  layers/no-impure-domain: The domain imports @nestjs/common: add it
  to domainDependencies if the domain really needs it.

1 violation
```

Each violation names its rule: the [rules](../rules/index.md) explain what each one checks and why.

### Options

| Option | What it does |
| --- | --- |
| `--project <dir>` | The project folder. Defaults to the current folder. |
| `--config <file>` | The configuration file. Defaults to `alveolus.config.ts`. |
| `--format json` | Prints the violations as JSON, for tools and agents. |

### Run it in continuous integration

So that no change lands without the check, add it to your scripts and run it with your other
checks:

```json [package.json]
{
	"scripts": {
		"lint:arch": "alveolus arch check"
	}
}
```

::: tip For coding agents
Give your agent the command and `--format json`: each violation says what is allowed instead, so
the agent can fix its own code before you review it.
:::

## Adopt it on an existing project

An existing project rarely keeps every rule from the start. A baseline lets you turn the checks on
today, and fix the past over time:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Record the current violations</span>Run <code>npx alveolus arch baseline</code>: it writes them to <code>alveolus.baseline.json</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Commit the file</span>From then on, <code>check</code> fails only on violations that are not in the baseline, and says how many it ignored.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Fix them over time</span>Each fix removes a violation from what the baseline covers. New code keeps every rule.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span>Record it again</span>Run <code>baseline</code> after a round of fixes: the file only shrinks.</div>
</div>

## See also

- [Learning path](./learning-path.md), the order in which to read the docs when you are new to DDD
- [Project layout](./project-layout.md), the folders and layers the checks expect
- [Building blocks](../core/index.md), the classes your code extends
- [Rules](../rules/index.md), what `alveolus arch check` verifies
- [Integrations](../integrations/index.md), to wire Alveolus into NestJS or another framework
