# Contributing

Alveolus is two packages: `@alveolus/core`, the building blocks, and `@alveolus/arch`, the checks.
Both follow *Domain-Driven Design Distilled* (Vaughn Vernon): a building block or a rule that the
book does not cover is a discussion before it is a pull request. Open an issue first.

## Set up

Node 24 and pnpm 11.

```sh
pnpm install
pnpm check          # lint, typecheck, dead code, tests: what CI runs
pnpm test:coverage  # the tests with the coverage gate of CI
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

`main` only moves through pull requests. CI runs on each one, in stages: the linter, the types
and the dead code in parallel; then the tests on ubuntu and windows with a coverage gate, the
build of both packages with the content of what would be published, and the documentation site.
`ci` is the status the branch requires: it fails when any job fails. A pull request that changes
a package without a changeset fails `check: changeset`.

- `pnpm check` is green.
- A change in what a rule reports, in a message, in a configuration key or in a public type has
  its page updated: users copy messages into issues.
- A change a user can see has a changeset: `pnpm changeset`, the package, the bump and one line.
  CI checks it for a change under `src/` or in `package.json` of a package; one that no user
  will notice, such as a refactoring, adds an empty changeset: `pnpm changeset --empty`.
  The release workflow turns the changesets into the changelog and the versions; see
  [Versioning](https://alveolus.dev/guide/versioning) for what counts as a breaking change.
- Commits say what changed and why: `feat(arch): report a Date in an event payload`.
