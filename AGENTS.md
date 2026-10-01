# Alveolus

Alveolus is a modular, opt-in toolkit for doing tactical Domain-Driven Design in TypeScript.
It provides two things:

1. **Building blocks**: base classes for modelling a domain (Entity, AggregateRoot, ValueObject,
   Identifier, DomainEvent, Repository, DomainService, Policy) plus a `Result` type for explicit
   business errors.
2. **Architecture tests**: a CLI, built on ts-morph, that statically checks that a codebase using
   those building blocks respects DDD rules and the Alveolus project layout.

Each package can be used on its own. Alveolus imposes no infrastructure: no bus, no DI container,
no ORM integration.

## Packages

| Package            | Purpose                                                                 | Runtime deps |
| ------------------ | ----------------------------------------------------------------------- | ------------ |
| `@alveolus/core`    | Building blocks, `Result`, application contracts                        | **none**     |
| `@alveolus/arch`    | Architecture rules + `alveolus` CLI (ts-morph based)                    | ts-morph     |
| `@alveolus/testing` | Test helpers: in-memory repositories, fakes, matchers for `Result`/events | allowed      |

`@alveolus/core` must stay dependency-free: it ends up in users' domain layers.

## Design principles

- **OOP style.** Building blocks are abstract classes, e.g. `class Order extends AggregateRoot<OrderId>`.
  The architecture tests identify building blocks **by inheritance**, so users must extend the
  base classes (no decorators, no file-name conventions for detection).
- **Errors are values.** Expected business failures are returned as `Result<T, E>`, never thrown.
  Exceptions are reserved for bugs and broken invariants.
- **Immutability by default.** Value objects are immutable; entities expose behaviour, not setters.
- **Explicit over magic.** No reflection, no decorators, no global registries.

## `@alveolus/core`

### Result

A discriminated union plus free functions. No class, no methods: narrowing works natively.

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

ok(value); err(error); map(result, fn); mapErr(result, fn); andThen(result, fn);
```

### Building blocks

- **ValueObject<Props>**: structural equality (`equals`), immutable props. Created through a static
  factory that validates input and returns a `Result`:
  `Email.create(raw): Result<Email, InvalidEmail>`. Validation is hand-written; no schema library.
- **Identifier<T>**: a typed id, itself a value object: `class OrderId extends Identifier<string>`.
- **Entity<Id>**: identity-based equality, typed `Identifier`.
- **AggregateRoot<Id>**: an entity that records domain events. Events are collected internally and
  retrieved with `pullDomainEvents()`, which returns them and clears the list. Publishing is the
  caller's job (repository / unit of work). Event sourcing is out of scope.
- **DomainEvent**: past-tense name, `occurredAt`, `aggregateId`, payload.
- **Repository<Aggregate, Id>**: interface (port) for loading and saving aggregates.
- **DomainService**, **Policy**: base classes marking stateless domain logic and business rules.

### Application contracts

Interfaces only, no implementation and no bus: `Command`, `Query`, `UseCase`, `EventPublisher`.

## `@alveolus/arch`

Run in CI with the CLI:

```sh
alveolus arch check
```

### Imposed project layout

The architecture tests assume one fixed layout. It is not configurable.

```
src/
  <bounded-context>/
    index.ts          # public API of the bounded context
    domain/           # aggregates, entities, VOs, events, Repository ports
    application/      # use cases, technical ports (mailer, clock, payment gateway…)
    driven/           # secondary adapters: implement ports (DB, HTTP clients, queues)
    driving/          # primary adapters: call use cases (HTTP controllers, CLI, consumers)
```

Example:

```
src/ordering/
  index.ts
  domain/
    order.ts
    order-repository.ts        # port
  application/
    place-order.ts             # use case
    payment-gateway.ts         # port
  driven/
    pg-order-repository.ts
    stripe-payment-gateway.ts
  driving/
    http/order-controller.ts
```

### Rule families

1. **Layer dependencies** (within a bounded context):
   - `domain` imports only `domain` and `@alveolus/core`.
   - `application` imports `domain` and `application`.
   - `driven` imports `domain` and `application` (to implement their ports).
   - `driving` imports `application`.
   - `driven` and `driving` never import each other.
2. **Building-block rules**, e.g. value objects are immutable, entities have no public setters,
   domain event names are in the past tense, an aggregate references another aggregate only by its
   identifier, Repository ports in `domain` are interfaces.
3. **Bounded-context isolation**: a bounded context imports another one only through its
   `index.ts`, never its internals.
4. **Naming and placement**, e.g. ports live in `domain`/`application` and their implementations
   in `driven`; building blocks sit in the layer they belong to.

## Repository conventions

- pnpm workspace monorepo: published packages live in `packages/*`, apps in `apps/*`. Node ≥ 24,
  ESM only.
- Documentation site: VitePress in `apps/docs` (`@alveolus/docs`), deployed to GitHub Pages
  (https://alveolusjs.github.io/alveolus/) by `.github/workflows/docs.yml` on every push to `main`.
  `apps/docs/guide/` holds the cross-package guide; each package has its own folder and sidebar in
  `apps/docs/<name>/` (served at `/<name>/`). When a package's API changes, update its docs in the
  same change. Keep the docs in sync with this file.
- Docs design system (`apps/docs/.vitepress/theme/style.css`): layout and typography copied from
  tsdown.dev (VitePress default theme, Inter, system mono); honey palette (`--al-honey-*` tokens
  mapped to `--vp-c-brand-*`); monochrome honey gradient on the hero name; the three-cell logo with
  a blurred halo as hero image; Lucide icons (inline SVG, `currentColor`) on feature cards;
  install commands as pnpm/npm/yarn/bun code groups. Local search and `/llms.txt` are enabled.
- Code, comments, docs and commit messages are in **English**.
- TypeScript is strict (`tsconfig.base.json`: `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`…). No `any`, no non-null assertions,
  no default exports (except `*.config.ts` and `apps/docs`, where VitePress requires them).
- Build with **tsdown** (ESM, `.mjs` + `.d.mts`). Declarations are emitted by oxc thanks to
  `isolatedDeclarations`, so exported APIs need explicit types.
- Versioning and changelogs with **changesets**; packages are published publicly on npm under
  `@alveolus`.
- Tests with Vitest: each package declares a project in its own `vitest.config.ts`; the root
  config runs them all.

### Commands

```sh
pnpm check       # lint + typecheck + knip + tests (run before considering work done)
pnpm lint:fix    # biome: format, lint and organize imports
pnpm build
pnpm test
pnpm knip        # unused files, exports and dependencies
pnpm docs:dev    # docs dev server
pnpm docs:build
```

### Adding a package

1. Copy `packages/core` (`package.json`, `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts`),
   rename it under the `@alveolus/` scope and run `pnpm install`.
2. Create `apps/docs/<name>/index.md` and add the package to the `packages` list in
   `apps/docs/.vitepress/config.ts` (nav, sidebar and page titles derive from it).

## Open questions

- Shared kernel: is there an `src/shared-kernel/` importable by every bounded context?
- Composition root: where are driven adapters wired into use cases (`src/main.ts`, per-BC
  `index.ts`)? The layer rules will have to exempt it.
- Can `driving` import `domain` types directly (e.g. to map errors), or only through `application`?
