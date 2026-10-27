# @alveolus/lint-config

The Alveolus rules that a linter decides without false positives, for [ESLint](https://eslint.org/) and
[dependency-cruiser](https://github.com/sverweij/dependency-cruiser). Few rules, each one exact: the rest stays
for review. Each message gives the code of its rule, its title in English and the url of its page.

```sh
pnpm add -D @alveolus/lint-config eslint typescript-eslint dependency-cruiser
```

## ESLint

```js
// eslint.config.mjs
import alveolus from '@alveolus/lint-config/eslint';

export default [...alveolus];
```

```sh
eslint src
```

ESLint 10 and typescript-eslint 8.71 or later. `nest new` installs oxlint since NestJS 12: an app removes it, or keeps it
for its own rules next to these ones.

## dependency-cruiser

```js
// .dependency-cruiser.cjs
module.exports = { extends: '@alveolus/lint-config/dependency-cruiser' };
```

```sh
depcruise src --output-type plugin:@alveolus/lint-config/dependency-cruiser-reporter
```

The reporter prints each violation as oxlint does: the code and the title of the rule, the import framed in its file,
the module it reaches, and the url of the rule. A cycle shows once, with the modules it goes through. It exits with the
number of errors, so a CI step fails on any of them.

```txt
  × LAY-04: Another bounded context comes in only through `public`, which holds only the contract
   ╭─[src/notifications/application/notification/notify.ts:2:24]
 1 │ import type { Clock } from '@alveolus/core';
 2 │ import { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.ts';
   ·                        ──────────────────────────┬─────────────────────────
   ·                                                  ╰── src/wallets/domain/wallet/wallet.aggregate.ts
 3 │
   ╰────
  help: https://alveolus.dev/rules/architecture-and-placement/layers/lay-04

Found 0 warnings and 1 error.
```

The line of an import is found by its text: an import written twice in a file points to the first one.
dependency-cruiser reads TypeScript with `typescript` 6 or earlier, which `nest new` installs: it does not read
TypeScript 7 yet.

## What it checks

| Rule | Tool | What it reports |
| --- | --- | --- |
| [LAY-04](https://alveolus.dev/rules/architecture-and-placement/layers/lay-04) | dependency-cruiser | An import of another bounded context outside its `public` folder: relative, through a `paths` alias, type-only, dynamic or re-exported. |
| [LAY-02](https://alveolus.dev/rules/architecture-and-placement/layers/lay-02) | dependency-cruiser | A cycle between sibling modules of a layer, even when no file imports itself back. A module and its own sub-module are not siblings. |
| [LAY-01](https://alveolus.dev/rules/architecture-and-placement/layers/lay-01) | dependency-cruiser | `domain` or `application` importing `driving` or `driven`. |
| [PUB-01](https://alveolus.dev/rules/integration/contracts/pub-01) | dependency-cruiser | `public` importing `domain`, `application`, `driving` or `driven` of its bounded context. |
| [LAY-01](https://alveolus.dev/rules/architecture-and-placement/layers/lay-01), [CTX-06](https://alveolus.dev/rules/strategic-design/bounded-contexts/ctx-06) | ESLint | `domain` importing any package but `@alveolus/core` and the `node:` modules. |
| [WIR-05](https://alveolus.dev/rules/architecture-and-placement/wiring/wir-05) | ESLint | `Injectable`, `Inject` or `Optional` of `@nestjs/common` imported outside `driving/http` and wiring files, under another name or through a namespace included. |
| [PLC-07](https://alveolus.dev/rules/architecture-and-placement/placement/plc-07) | ESLint | `@prisma/client` imported outside `driven/prisma` and `application`, and `@nestjs/swagger` outside `driving/http`. |

Wiring files (`.module`, `.wiring`, `.bootstrap`, `.config`) and tests (`__test__`, `.spec.ts`) are left out.

## What it does not see

- The layout is the reference one: each bounded context in `src/<context>/`, shared code in `src/shared/`. A bounded
  context declared elsewhere in `architecture.json` is not checked.
- `@prisma/client` stays allowed in every `application`, because a transaction script uses it there: in a tactical
  bounded context, it is left to review. A Prisma client generated to another path is not seen.
- ESLint gives each file one set of options per rule: an app that configures `no-restricted-imports` itself replaces
  these restrictions for the files it covers.

## Waivers

A waiver gives the code of the rule and its reason, as [the site](https://alveolus.dev/start/overview#waivers) defines
it.

```ts
// eslint-disable-next-line no-restricted-imports -- waiver WIR-05: <reason>, see ADR-NNNN
import { Injectable } from '@nestjs/common';
```

dependency-cruiser has no comment for it. `depcruise-baseline src` records the violations that remain, and
`depcruise src --ignore-known` leaves them out. A cycle of LAY-02 is not recorded there: the app redeclares the rule
by its name, and each key it gives replaces the one of the preset.

```js
module.exports = {
	extends: '@alveolus/lint-config/dependency-cruiser',
	forbidden: [
		{
			name: 'LAY-02',
			comment: 'waiver LAY-02: <reason>, see ADR-NNNN',
			from: {
				path: '^src/([^/]+)/(domain|application|driving|driven|public)/',
				pathNot: '^src/wallets/domain/holder$',
			},
		},
	],
};
```

- [Documentation](https://alveolus.dev/)
- [Source](https://github.com/alveolusjs/alveolus/tree/main/packages/lint-config)

Node.js 24 or later. MIT.
