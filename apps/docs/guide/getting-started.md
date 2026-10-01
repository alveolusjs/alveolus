# Getting started

Alveolus comes as two packages: `@alveolus/core`, the building blocks your code extends, and
`@alveolus/arch`, the command that checks your project keeps the architecture.

::: warning
Alveolus is in alpha: the API may change between versions until 1.0.
:::

## Prerequisites

- Node.js 24 or later.
- TypeScript resolving packages the way Node.js does. The packages are ES modules described by an
  `exports` map; Node.js 24 also loads them from a CommonJS application, such as a default NestJS
  one.

```json [tsconfig.json]
{
	"compilerOptions": {
		"module": "node20"
	}
}
```

`"nodenext"` works as well.

## Install

`@alveolus/core` is a dependency: it ends up in your domain. `@alveolus/arch` is only needed to
check the code: a development dependency.

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

Import what you extend from `@alveolus/core`. Every building block is an abstract class: your class
says what it is by extending it.

```ts
import { Identifier } from "@alveolus/core";

export class OrderId extends Identifier<string, "OrderId"> {}
```

Each building block also has its own entry point, for instance `@alveolus/core/aggregates` or
`@alveolus/core/result`. Both forms give the same classes; use the one you prefer.

## Configure the checks

Create `alveolus.config.ts` at the root of the project. It says where the source code is and which
folders are bounded contexts.

```ts [alveolus.config.ts]
import { defineConfig } from "@alveolus/arch";

export default defineConfig({
	boundedContexts: { catalog: "catalog", ordering: "ordering" },
	root: "src",
});
```

| Option               | Default                  | Description                                                                 |
| -------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `root`               |                          | The source folder.                                                          |
| `boundedContexts`    |                          | Each bounded context and its folder, relative to `root` (`"modules/ordering"` works). |
| `sharedKernel`       | `"shared-kernel"`        | The folder shared by every bounded context, relative to `root`.             |
| `compositionRoot`    | `"*.module.ts"`          | The file, at the root of a bounded context, that wires it.                  |
| `domainDependencies` | `[]`                     | npm packages the domain may import, besides `@alveolus/core`.               |
| `ignore`             | test files               | More files to leave out, as globs from the project folder. `*.spec.ts`, `*.test.ts` and `__tests__/` are always left out. |
| `rules`              | every rule on            | Turn a rule off: `{ placement: "off" }`.                                    |

## Run the checks

```sh
npx alveolus arch check
```

On a project that keeps the rules, the command prints `No violation` and exits with code 0.
Otherwise it lists each violation, with what is allowed instead, and exits with code 1:

```
src/ordering/domain/aggregates/order.aggregate.ts:1
  domain-purity: The domain imports @nestjs/common: add it to domainDependencies if the domain really needs it.

1 violation
```

| Option              | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `--project <dir>`   | The project folder. Defaults to the current folder.     |
| `--config <file>`   | The configuration file. Defaults to `alveolus.config.ts`. |
| `--format json`     | Prints the violations as JSON, for tools and agents.    |

Add it to your scripts, and run it with your other checks in continuous integration:

```json [package.json]
{
	"scripts": {
		"lint:arch": "alveolus arch check"
	}
}
```

## Adopt it on an existing project

An existing project rarely keeps every rule from the start. Record its current violations:

```sh
npx alveolus arch baseline
```

The command writes them to `alveolus.baseline.json`; commit the file. From then on, `check` fails
only on violations that are not in the baseline, and reports how many it ignored. Fix them over
time, then run `baseline` again: the file only shrinks.
