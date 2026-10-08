# Contributing

Alveolus is two packages: `@alveolus/core`, the building blocks, and `@alveolus/arch`, the checks.
Both follow *Domain-Driven Design Distilled* (Vaughn Vernon): a building block or a rule that the
book does not cover is a discussion before it is a pull request. Open an issue first.

## Set up

Node 24 and pnpm 11.

```sh
pnpm install
pnpm check          # lint, typecheck, dead code, tests: what CI runs on ubuntu and windows
pnpm docs:dev       # the documentation site
```

## Where things are

- `packages/core`: one folder per building block, the class, its test, and its page in
  `apps/docs/core/`.
- `packages/arch`: see [its contributing guide](./packages/arch/CONTRIBUTING.md) for how a rule is
  written, tested, registered and documented, and [ARCHITECTURE.md](./packages/arch/ARCHITECTURE.md)
  for the map of the package.
- `apps/docs`: VitePress. Every public thing has a page; the build fails on a dead link.

## The code

No comments: the code says what it does through its names and shape, and the *why* lives in the
documentation and the commit messages. No loose functions: a helper is a method of the class that
owns it. `readonly` and `private` by default. Loops over clever chains.

## A pull request

- `pnpm check` is green.
- A change in what a rule reports, in a message, in a configuration key or in a public type has
  its page updated: users copy messages into issues.
- A new rule or a new building block has its page, its tests, and a line in the changelog.
- Commits say what changed and why: `feat(arch): report a Date in an event payload`.
