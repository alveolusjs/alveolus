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
- `packages/claude-plugin`: the Claude Code plugin `alveolus`.
- `packages/context-mapper`: validates and draws a context map written in CML.

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
