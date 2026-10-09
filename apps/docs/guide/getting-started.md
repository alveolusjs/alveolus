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
Alveolus is at `0.x`: a minor version may still rename a rule or a configuration key, and the
changelog says what to do. See [Versioning](./versioning.md).
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

Create `alveolus.config.ts` at the root of the project. It says where the source code is, which
folders are bounded contexts and which subdomain each one implements; everything else has a
default.

```sh
npx alveolus init
```

writes a starting one, with the [instructions for a coding agent](./agents.md); it never
overwrites a file. Or write it yourself:

```ts [alveolus.config.ts]
import { defineConfig } from "@alveolus/arch";

export default defineConfig({
	boundedContexts: { catalog: "catalog", notifications: "notifications", ordering: "ordering" },
	root: "src",
	subdomains: { core: ["catalog", "ordering"], generic: ["notifications"] },
});
```

A [core](./project-layout.md#core-supporting-generic) context is checked by every rule. A
supporting or generic one is checked only at its boundary: it may be written any way you like, as
long as it reaches the other contexts through their open host services.

### Options

| Option | Default | What it does |
| --- | --- | --- |
| `root` | required | The source folder. |
| `tsconfig` | `"tsconfig.json"` | The TypeScript configuration the sources are read with, relative to the project folder. |
| `boundedContexts` | required | Each bounded context and its folder, relative to `root`. `"modules/ordering"` works. |
| `sharedKernel` | `"shared-kernel"` | The folder shared by every bounded context, relative to `root`. |
| `subdomains` | required | The [subdomain](./project-layout.md#core-supporting-generic) each bounded context implements: `{ core: ["ordering"], supporting: ["billing"], generic: ["notifications"] }`. Every context is listed once. |
| `contextMap` | none | For each bounded context, the ones it consumes: `{ payments: ["ledger"] }`. Checked for cycles; without it, only cycles are reported. |
| `compositionRoot` | `"*.module.ts"` | The file, at the root of a bounded context, that wires it. |
| `domainDependencies` | `{}` | npm packages the domain may import, besides `@alveolus/core`. |
| `applicationDependencies` | `{}` | npm packages the application may import, besides `@alveolus/core` and `domainDependencies`. |
| `ignore` | test files | More files to leave out, as globs from the project folder. |
| `layout.extraFolders` | `{}` | Folders of your own under `domain/` or `application/`, besides those of the building blocks: `{ domain: ["specifications"] }`. |
| `rules` | every rule `"error"` | The level of a rule: `"error"` fails the check, `"warn"` and `"info"` only report, `"off"` silences it: `{ "tactical/no-public-field": "warn" }`. |

`domainDependencies` and `applicationDependencies` take `true` for every name of a package, or the
list of names allowed:

```ts
domainDependencies: { "decimal.js": true, "date-fns": ["addDays"] },
```

Tests and their companions are always left out, whatever `ignore` says: `*.spec.ts`, `*.test.ts`,
`*.e2e-spec.ts`, `*.fixture.ts`, `*.stories.ts`, `__tests__/` and `__mocks__/`.

## Run the checks

```sh
npx alveolus arch check
```

On a project that keeps the rules, the command prints `No violation` and exits with code 0.
Otherwise it lists each violation, with what is allowed instead, and exits with code 1:

```
src/ordering/domain/aggregates/order.aggregate.ts
  1  error  layers/no-impure-domain: The domain imports @nestjs/common: add it
  to domainDependencies if the domain really needs it.

1 violation
```

Each violation names its rule: the [rules](../rules/index.md) explain what each one checks and why.
The same pages are installed with the package, for the terminal and for a
[coding agent](./agents.md):

```sh
npx alveolus explain layers/no-impure-domain
npx alveolus explain aggregates
npx alveolus explain
```

A rule by its id, a building block or a guide by its name, and without argument the list of
topics.

### Options

| Option | What it does |
| --- | --- |
| `--project <dir>` | The project folder. Defaults to the current folder. |
| `--config <file>` | The configuration file. Defaults to `alveolus.config.ts`. |
| `--tsconfig <file>` | The TypeScript configuration the sources are read with. Defaults to `tsconfig.json`, or to the `tsconfig` of the configuration file. |
| `--format json` | Prints the violations as JSON, for tools and agents. |
| `--format sarif` | Prints SARIF 2.1.0, for GitHub code scanning and the other analysers: upload it with `github/codeql-action/upload-sarif`. |

The exit code says what happened: `0` when no error is reported (warnings and infos never fail
the check), `1` when at least one error is, `2` when the configuration or the analysis itself
failed, with the reason on stderr. The summary counts the files analysed: `No violation in 142
files` on `0 files` would hide a wrong `root`.

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

The short version; the [guide for an existing project](./existing-project.md) has the whole path.

An existing project rarely keeps every rule from the start. A baseline lets you turn the checks on
today, and fix the past over time:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Record the current violations</span>Run <code>npx alveolus arch baseline</code>: it writes them to <code>alveolus.baseline.json</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Commit the file</span>From then on, <code>check</code> fails only on violations that are not in the baseline, and says how many it ignored.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Fix them over time</span>Each fix removes a violation from what the baseline covers. New code keeps every rule.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span>Record it again</span>Run <code>baseline</code> after a round of fixes: the file only shrinks. It refuses to grow, unless you pass <code>--allow-growth</code>.</div>
</div>

### How a violation is recognised

Each entry of the baseline keeps the rule, the file, the symbol and a fingerprint of the reported
line: a short hash of its text, blind to indentation and spacing.

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title">Still baselined</span>The code around it moves, the file is reformatted: the line keeps its text, so its fingerprint.</div>
<div class="al-card"><span class="al-card-title">Reported again</span>The line itself changes. Touching a baselined line is the moment to fix it.</div>
</div>

When a baselined violation is fixed, `check` says so (`4 fixed` in the summary, and a note on
stderr) without failing: run `baseline` again to drop the entries.

A new violation never hides behind a fixed one: a second `throw` in the same file has another
line, so another fingerprint. A baseline written before fingerprints existed matches nothing:
`check` says so, and `baseline` writes it again.

## Turn a violation off

A violation can be right to keep for a while. Turn it off where it stands, with the rule and a
reason, and the reviewer sees both:

```ts
// alveolus-disable-next-line layers/no-impure-domain: legacy pool, removed with ORD-412
import { Pool } from "pg";
```

The summary counts the disabled violations, `--format json` lists them with their reason, and a
comment that names no rule, gives no reason or disables nothing is reported by
[`tooling/no-loose-disable`](../rules/tooling/no-loose-disable.md). For a whole file, use
`ignore`; for a whole rule, `rules`; for the past, the baseline.

## See also

- [Learning path](./learning-path.md), the order in which to read the docs when you are new to DDD
- [Project layout](./project-layout.md), the folders and layers the checks expect
- [Building blocks](../core/index.md), the classes your code extends
- [Rules](../rules/index.md), what `alveolus arch check` verifies
- [Integrations](../integrations/index.md), to wire Alveolus into NestJS or another framework
