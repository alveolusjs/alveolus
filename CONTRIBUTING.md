# Contributing

Alveolus is a rulebook of Domain-Driven Design and architecture rules for TypeScript / NestJS, and
the tools to build an app with them. [AGENTS.md](./AGENTS.md) is the working guide: what each folder
holds, how a rule is written, the editorial constraints of the site, and the commit conventions.

A new rule, or a change in what a rule asks, is a discussion before it is a pull request. Open an
issue first.

## Set up

Node 24 and pnpm 11.

```sh
pnpm install
pnpm docs:dev       # the site
pnpm check          # Biome (lint + format)
pnpm typecheck      # TypeScript, package by package
pnpm test           # the tests of the packages
pnpm build          # the site, @alveolus/core, and the rules of claude-rules
```

## Where things are

- `docs/`: the site, in French, built with VitePress. One rule is one Markdown file; the sidebar,
  the tables and the index are generated from the frontmatter.
- `packages/core`: `@alveolus/core` on npm, the building blocks, with no runtime dependency.
- `packages/claude-rules`: `@alveolus/claude-rules` on npm, the approved rules as Claude Code rules.
- `packages/fitness-functions`: `@alveolus/fitness-functions` on npm, the checks of an app against
  the rules, added one rule at a time.
- `packages/claude-plugin`: the Claude Code plugin `alveolus`.
- `packages/context-mapper`: validates and draws a context map written in CML.

## A fitness function

`packages/fitness-functions/ARCHITECTURE.md` maps the package and its principles: read it
first. `packages/fitness-functions/src/rules/` mirrors the rules of the site: a part, a theme, then one
folder per automated rule, named by its code. LAY-04 lives in
`architecture-and-placement/layers/lay-04/`, next to its page
`docs/src/rules/architecture-and-placement/layers/lay-04.md`.

```txt
lay-04/
├── lay-04.ts                  class Lay04 extends FitnessFunction, its Rule: code, title, url, styles
└── __test__/
    └── lay-04.test.ts         one it() per form the rule reports, its files written inline
```

A test starts from the reference app (`src/__test__/support/reference-app.ts`), a small app that
follows every rule, and adds the files of its case:

```ts
const project = TestProject.app().with(
	'src/notifications/application/notify.ts',
	`import { Wallet } from '../../wallets/domain/wallet.aggregate.ts';`,
);

expect(project.check('LAY-04').map(String)).toEqual([
	'src/notifications/application/notify.ts:1 LAY-04 imports src/wallets/domain/wallet.aggregate.ts, outside src/wallets/public',
]);
```

Every fitness function must accept the reference app: `reference-app.test.ts` checks it. When a
new rule needs a compliant form the app does not show yet, add it to the reference app. Its
`wallets` is tactical and its `notifications` a transaction script.

A fitness function receives a `Project`: the files of the bounded contexts of its styles, plus
shared and root files, never the inside of a big ball of mud. `project.placementOf(path)` gives
the bounded context and the folder of any file, the targets of imports included.

`packages/fitness-functions/TRIAGE.md` says, for every rule of the site, whether a fitness
function can check it (`full`, `partial` or `no`), with which facts about the code, and what it
would report. Pick the next rule there, among those whose facts exist.

To add one: create the folder, copy the code, the title and the styles of the page into the
`Rule` of the class, with the coverage of its row in `TRIAGE.md` and one sentence on what it
checks, then add the class to the `index.ts` of its theme. The registry test fails
when a folder is not registered, when a class does not carry the code of its folder, when its
title, url or styles differ from its page, or when the rule is not approved on the site, in the
same part and theme. The triage test fails when an approved rule has no row in `TRIAGE.md`, or
when a fitness function declares another coverage than its row.

## A pull request

`main` only moves through pull requests. CI runs on each one: Biome and the types in parallel,
then the tests on ubuntu and windows, the build and the content of each package, and the site.
`ci` is the status the branch requires: it fails when any job fails. A pull request that changes
a package without a changeset fails `check: changeset`.

- `pnpm check && pnpm typecheck && pnpm test && pnpm build` is green.
- A change a user of a package can see has a changeset: `pnpm changeset`, the package, the bump
  and one line. A change no user will notice adds an empty one: `pnpm changeset --empty`.
- `@alveolus/claude-rules` ships the approved rules: a change to an approved rule, or an approval,
  has a changeset for it. CI checks it.
- Commits follow Conventional Commits: `docs(rules): translate the messaging theme into French`.
