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

## Positioning

Architectures drift over time (deadlines, team changes, shortcuts), and coding agents speed this
up: they solve the task at hand and forget past decisions. Alveolus gives agents and developers
proven guidelines (Domain-Driven Design, Evans 2003 / Vernon 2013) as code they extend and rules
CI verifies. Audiences: developers who know DDD (a practical aid, familiar vocabulary) and people
building with agents without DDD knowledge (guardrails that keep the project coherent). One
message for both, developers first and agents as an accelerator of the problem, not the whole
pitch; sober, technical tone, no superlatives; only claim what exists. Home page headline: "Keep
your domain model clean, whoever writes the code."

## Packages

| Package            | Purpose                                                                 | Runtime deps |
| ------------------ | ----------------------------------------------------------------------- | ------------ |
| `@alveolus/core`    | Building blocks, `Result`, application contracts                        | **none**     |
| `@alveolus/arch`    | Architecture rules + `alveolus` CLI (ts-morph based)                    | ts-morph     |
| `@alveolus/testing` | Test helpers: scenarios and assertions for `Result`/events                | allowed      |

`@alveolus/core` must stay dependency-free: it ends up in users' domain layers.

## Source layout

Source folders follow the documentation tree: the sidebar, `apps/docs/` and each package's `src/`
have the same shape. Every leaf folder has an `index.ts` (its public API); a folder imports another
one only through its `index.ts`; `src/index.ts` re-exports everything. Public leaf folders are
exposed as short subpaths named after the folder (`src/domain/aggregates/` →
`@alveolus/core/aggregates`). Only create a folder when it gets its first code.

```
packages/core/src/
  domain/          aggregates/ value-objects/ entities/ domain-events/ domain-errors/
                   domain-services/ policies/ repositories/ views/
  utilities/       result/
  application/     command-handlers/ query-handlers/ event-publishers/ notifications/ ports/
packages/testing/src/
  scenarios/ event-assertions/
packages/arch/src/
  cli/             CLI entry, check() engine, output format
  project-layout/  every */location rule and repository/location
  rules/           aggregates/ entities/ value-objects/ domain-events/ domain-services/
                   policies/ repositories/ shared/ (rules shared by several building blocks)
  building-blocks/ detection (base-class chain, repositories) and ts-morph context; no docs page
```

Arch tests mirror this: `test/cli.test.ts`, `test/project-layout.test.ts`, `test/rules/*.test.ts`.

The concepts come from *Implementing Domain-Driven Design* (Vaughn Vernon); this is the reading map
from its chapters to Alveolus, never shown in the docs:

| #  | Chapter                       | Where                                                |
| -- | ----------------------------- | ---------------------------------------------------- |
| 2  | Domains, Subdomains, BCs      | arch: BC isolation (planned)                         |
| 3  | Context Maps                  | arch (planned)                                       |
| 4  | Architecture                  | arch: layer dependencies (planned), project layout   |
| 5  | Entities                      | core `domain/entities`, arch `rules/entities`        |
| 6  | Value Objects                 | core `domain/value-objects`, arch `rules/value-objects` |
| 7  | Services                      | core `domain/domain-services`, `domain/policies`     |
| 8  | Domain Events                 | core `domain/domain-events`, testing `event-assertions` |
| 9  | Modules                       | arch `project-layout`                                |
| 10 | Aggregates                    | core `domain/aggregates`, testing `scenarios`        |
| 11 | Factories                     | static factories, `non-public-constructor`           |
| 12 | Repositories                  | core `domain/repositories`, snapshots in `Entity`    |
| 13 | Integrating Bounded Contexts  | core `application/notifications`; ACL/OHS planned    |
| 14 | Application                   | core `application`                                   |
| A  | Aggregates and Event Sourcing | out of scope for now                                 |

## Design principles

- **OOP style.** Building blocks are abstract classes, e.g. `class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderEvent>`.
  The architecture tests identify building blocks **by inheritance**, so users must extend the
  base classes (no decorators, no file-name conventions for detection).
- **Errors are values.** Expected business failures are returned as `Result<T, E>`, never thrown.
  Exceptions are reserved for bugs and broken invariants.
- **Immutability by default.** Value objects are immutable; entities expose behaviour, not setters.
- **Explicit over magic.** No reflection, no decorators, no global registries.

## `@alveolus/core`

### Result (implemented, `src/utilities/result/`)

A discriminated union plus free functions. No class, no methods: narrowing works natively.

```ts
type Result<T, E> = Ok<T> | Err<E>; // { ok: true; value } | { ok: false; error }

ok(); ok(value); err(error); map(result, fn); mapErr(result, fn); andThen(result, fn);
combine([a, b]); combine({ a, b }); // values in the same shape, or the first error
```

`ok()` without argument is the success of a command (`Result<void, never>`). Business errors are
`DomainError<Payload>` subclasses, one per failure (`class InvalidTotal extends DomainError<{
total: number }> {}`, `new OrderAlreadyPlaced()` when there is no payload); `type` is the class
name. A `DomainError` is a value, not an `Error`: returned, never thrown.

### Building blocks

- **ValueObject<Props>** (implemented, `src/domain/value-objects/`): `props` copied and frozen one level
  deep (`protected readonly props`); `equals` requires the same concrete class and deeply equal
  props (nested value objects via `equals`, arrays, dates, plain objects). Private constructor,
  static factories returning a `Result`; operations return new instances.
- **Identifier<T, Tag>** (implemented): typed id compared by value (`string | number | bigint`).
  `Tag` is a type-only brand that makes ids nominal: `class OrderId extends Identifier<string, "OrderId">`.
  `equals` requires the same concrete class.
- **Entity<Id, Snapshot extends JsonValue>** (implemented): identity-based equality, same concrete
  class required. Abstract public `toSnapshot(): Snapshot` (JSON only, declared with a `type`
  alias: identifiers as values, value objects as primitives, dates as ISO strings, nested entities
  through their own snapshot; interfaces, `Date` and class instances are rejected); a static
  `fromSnapshot(snapshot)` rebuilds it (TypeScript has no abstract static: checked by the arch
  rule `*/from-snapshot`). `JsonValue` and `AnyEntity` are exported from `entities`. Lives inside
  an aggregate; does not record domain events (only the root does).
- **DomainEvent<Id, Payload>** (implemented): one subclass per event, named in the past tense, with
  a typed `payload`; no static members (`class OrderPlaced extends DomainEvent<OrderId, { total:
  number }> {}`). `type` is `this.constructor.name`, so user code must keep class names when
  bundled. Built from `{ aggregateId, occurredAt, payload }`; `occurredAt` is always explicit (the
  domain never reads the clock).
- **AggregateRoot<Id, Snapshot, Event>** (implemented): extends `Entity<Id, Snapshot>`; `Event` is
  the union of events it can record. `static fromSnapshot(snapshot, version)` rebuilds it without
  checking rules or recording events; repositories store `toSnapshot()`.
  Public business methods return a `Result`.
  Protected `record(event)`; `domainEvents` reads pending events without clearing them;
  `pullDomainEvents()` returns and clears them. Publishing is the caller's job (repository / unit
  of work). `version` is the persisted version passed at construction (`{ version }`, default 0)
  and never changed by the aggregate; repositories use it for optimistic concurrency. Event
  sourcing is out of scope.
- **Repository<Aggregate>** (implemented, `src/domain/repositories/`): interface (port) with
  `findById(id: Aggregate["id"]): Promise<Aggregate | undefined>` and `save(aggregate)`. Users
  extend it per aggregate (`interface OrderRepository extends Repository<Order>`) in
  `domain/repositories/` and implement it in `driven/`. `save` leaves pending events on the
  aggregate and throws `ConcurrencyError` (an `Error`, technical failure, not a `DomainError`) when
  the stored version differs from `aggregate.version`. `AnyAggregateRoot` is exported from
  `aggregates`.
- **DomainService** (implemented, `src/domain/domain-services/`): empty abstract class marking a stateless domain
  operation that does not belong to one entity or value object. Public constructor; may receive
  values or other services in `readonly` fields.
- **Policy<Subject, Error>** (implemented, `src/domain/policies/`): business rule as an object, with
  `abstract check(subject): Result<void, Error>` (`Error extends AnyDomainError`); several values
  go in one subject object. Stateless like a domain service; aggregates receive it as a parameter.

### Application contracts (implemented, `src/application/`)

Interfaces only (plus the `Notification` envelope), no implementation and no bus:

- `CommandHandler<Input, Output = void, Error extends AnyDomainError = never>` and
  `QueryHandler<Input, Output, Error = never>` (`command-handlers/`, `query-handlers/`): one
  `handle(input): Promise<Result<Output, Error>>`. Same shape, different intent; whether a command
  returns data is the team's choice. The input is a plain type named after the request
  (`PlaceOrder`, `GetOrder`).
- `EventPublisher` (`event-publishers/`): `publish(events: readonly AnyDomainEvent[]): Promise<void>`,
  called by command handlers with `pullDomainEvents()` after `save`; throws on failure.
- `Notification<Event, Metadata extends object = object>` (`notifications/`, IDDD's notification): concrete
  class wrapping a domain event to publish it to other bounded contexts, built from
  `{ id, event, metadata, version? }` (`version` of the event format, default 1, positive integer
  or `RangeError`; `metadata` is application data such as an audit trail — who, how, correlation
  id — always passed, `{}` when empty, typed `Metadata` and inferred; no `as` and no `?.`); `type` and `occurredAt`
  copied from the event. Serializes with `JSON.stringify`; consumers read the JSON and never import the
  event class. Sent through the `NotificationPublisher<Metadata extends object = object>` port
  (`publish(notifications)`, typed metadata); `AnyNotification` is any notification;
  `EventPublisher` stays for domain events inside the context. No separate integration-event
  class (decided: domain event + notification, as in IDDD).

Views are business read models: showing the business is still business, so they live in the
domain. Plain JSON types in `domain/views/*.view.ts` (`OrderSummary`); each has a view repository in
`domain/repositories/*.repository.ts` extending core `ViewRepository<View extends JsonValue>`
(`domain/views/` in core, empty marker interface, `@alveolus/core/views`), implemented in
`driven/`. Query handlers return them. Never put a port next to its view: one kind per folder and
per file. A view can also be built from an aggregate by mapping its `toSnapshot()`.

Technical ports (clock, id generator, mailer, payment gateway) extend core `Port` (empty marker
interface, `application/ports/` in core, `@alveolus/core/ports`), live in `application/ports/*.port.ts`
of a bounded context or of the shared kernel, and are implemented in `driven/`. Every concept has a
block in core so that arch can detect it: classes by inheritance, ports by an interface they
extend, plain types (views, commands, queries, metadata) as type arguments of a core block. The
two empty marker interfaces are allowed by a targeted `noEmptyInterface` override in `biome.json`.

## `@alveolus/testing`

Runner-agnostic helpers that throw `node:assert` `AssertionError`s (Vitest, Jest, `node:test`).
`@alveolus/core` is a peer dependency.

- `given(aggregate).when(action)` returns a scenario holding `aggregate` and the action's `result`;
  assertions: `thenSucceeded()`, `thenFailedWith(ErrorClass, payload?)`,
  `thenRecorded(EventClass, payload?)`, `thenRecordedNothing()`.
  `given` discards events recorded while building the aggregate. Never name a method `then`
  (it would make the object a thenable).
- `assertRecorded(aggregate, EventClass, payload?)` returns the matching event;
  `assertRecordedNothing(aggregate)`. Both read `domainEvents` and never clear them.

## `@alveolus/arch`

`alveolus arch check [--project <tsconfig>]` (default `./tsconfig.json`) loads the project with
ts-morph and analyses its files under `src/`. Output: one `file:line:col  rule` line plus message
per violation, then a summary; exit 0 (clean), 1 (violations), 2 (usage error, missing tsconfig).
The CLI wraps `check({ project }): Violation[]`, exported from `@alveolus/arch`. No ignore
mechanism for now. See [Source layout](#source-layout) for where each rule lives.

Building blocks are detected with the type checker, through the base-class chain and the
`@alveolus/core` package (nearest `package.json` name): `AggregateRoot` → aggregate, otherwise
`Entity` → entity, `ValueObject` → value object, `Identifier` → identifier, `DomainEvent` →
domain event, `DomainError` → domain error, `DomainService` → domain service, `Policy` →
policy. Rule ids are prefixed by the building block (`aggregate/`, `entity/`, `value-object/`),
even when the implementation is shared (`src/rules/shared/`).

- Shared by aggregates and entities: `no-public-mutable-state`, `public-methods-return-result`
  (public instance methods return `Result`/`Ok`/`Err` from core; getters, static factories,
  Promise-returning methods and methods implementing an abstract method of a core base class,
  i.e. `toSnapshot`, are not concerned), `from-snapshot` (a public static `fromSnapshot`, own or
  inherited; abstract classes exempt).
- Shared by all three: `no-hidden-clock`, `no-io` (Promise-returning methods, `*Repository`
  dependencies), `non-public-constructor`.
- Location and naming (`src/project-layout/`, two rules per kind: `<kind>/location` and
  `<kind>/file-suffix`): every building block lives under a `domain` folder (below a bounded
  context or `shared-kernel`), in the folder of its kind, subfolders allowed, and its file name ends
  with the suffix of its kind: `aggregates/*.aggregate.ts`, `entities/*.entity.ts`,
  `value-objects/*.value-object.ts` and `*.identifier.ts`, `events/*.event.ts`,
  `errors/*.error.ts`, `services/*.service.ts`, `policies/*.policy.ts`; repository ports
  `repositories/*.repository.ts` (`repository/file-suffix`). Classes implementing core
  `CommandHandler`/`QueryHandler` (`findHandlers`): `command-handler/location`
  (`application/commands/`), `command-handler/file-suffix` (`*.command.ts`), same for
  `query-handler/*` (`application/queries/`, `*.query.ts`). Same pair of rules, through
  `findApplicationTypes` and `findPortsOf`, for `view/*` (type argument of `ViewRepository`:
  `domain/views/*.view.ts`), `view-repository/*` (`domain/repositories/*.repository.ts`),
  `port/*` (`application/ports/*.port.ts`, shared kernel included), `command/*` and `query/*`
  (input type of a handler: `*.command.ts`, `*.query.ts`), `metadata/*` (metadata type of
  `Notification`/`NotificationPublisher`: `application/metadata/*.metadata.ts`); inline types are
  skipped. `*/adapter-location`: classes implementing a `Repository`, `ViewRepository` or `Port`
  live in `driven/` (`checkAdapters`).
- Repositories (`findRepositories` in `src/building-blocks/`): ports are
  interfaces extending core `Repository` (directly or not), adapters are classes whose class chain
  `implements` one. `repository/location` (`src/project-layout/`): ports in `domain/repositories/`;
  `repository/adapter-location` (`src/rules/repositories/`): adapters in a `driven/` folder.
- Domain service and policy (`src/rules/domain-services/`, `src/rules/policies/`): shared `stateless` (no
  non-readonly field or parameter property, no setter, no assignment or `++`/`--` on `this`
  outside the constructor, no field holding an aggregate or entity), `no-hidden-clock`, `no-io`.
- Domain event only (`src/rules/domain-events/`): `past-tense` (last PascalCase word ends in `-ed`,
  outside a short exclusion list such as `Need`/`Speed`, or is a listed irregular past form such as
  `Sent`/`Withdrawn`; an `Event` suffix fails), `no-static-members` (properties, methods,
  accessors, static blocks).
- Aggregate only: `reference-by-identity` (other aggregates in properties, parameters and
  getters; method return types are exempt so an aggregate can be the factory of another),
  `no-inheritance` (extend `AggregateRoot` directly), `one-per-file`.
- Entity only: `reference-by-identity` (any aggregate, including its own; same exemption),
  `no-domain-events`.
- Value object only: `immutable` (no non-readonly property of any scope, no setter, no assignment
  or `++`/`--` on `this` outside the constructor), `no-identity` (no identifier, entity or
  aggregate in props, properties, parameters or return types), `factories-return-result` (public
  static methods return a `Result`).

Rules are tested against fixture projects in `packages/arch/test/fixtures/{valid,invalid}`
(own `tsconfig.json`, resolve `@alveolus/core` through the `@alveolus/source` condition). The
invalid project has one file per rule; tests assert rule, line and message. Fixtures are excluded
from the package typecheck and from knip.

### Imposed project layout

The architecture tests assume one fixed layout. It is not configurable. Inside `domain`, code is
grouped by kind of building block; inside `application`, by kind of element. Every file name ends
with the kind of what it declares (`order.aggregate.ts`); tests sit next to the code and keep its
name (`order.aggregate.test.ts`).

```
src/
  <bounded-context>/
    index.ts          # public API of the bounded context
    domain/
      aggregates/     # *.aggregate.ts     AggregateRoot subclasses
      entities/       # *.entity.ts        Entity subclasses
      value-objects/  # *.value-object.ts  ValueObject, *.identifier.ts Identifier subclasses
      events/         # *.event.ts         DomainEvent subclasses
      errors/         # *.error.ts         DomainError subclasses
      repositories/   # *.repository.ts    Repository ports (interfaces) and view repositories
      views/          # *.view.ts          views: business read models (types)
      services/       # *.service.ts       DomainService subclasses
      policies/       # *.policy.ts        Policy subclasses
    application/
      commands/       # *.command.ts       command type + its CommandHandler
      queries/        # *.query.ts         query type + its QueryHandler
      ports/          # *.port.ts          technical ports of the context (payment gateway…)
      metadata/       # *.metadata.ts      notification metadata (Audit)
    driven/           # secondary adapters: implement ports (DB, HTTP clients, queues)
    driving/          # primary adapters: call use cases (HTTP controllers, CLI, consumers)
  shared-kernel/      # shared by every bounded context, same layout
    domain/
      value-objects/
    application/
      ports/          # technical ports used everywhere (Clock, IdGenerator)
```

Example: `apps/example` follows this layout (see Repository conventions).

### Rule families

1. **Layer dependencies** (within a bounded context):
   - `domain` imports only `domain` and `@alveolus/core`.
   - `application` imports `domain` and `application`.
   - `driven` imports `domain` and `application` (to implement their ports).
   - `driving` imports `application` and `domain` (types and errors, e.g. to map errors with
     `instanceof`).
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
- Example application: `apps/example` (`@alveolus/example`, private) is a real project built with
  the packages, grown step by step to exercise them end to end. It follows the imposed layout
  (`src/ordering/` with `domain/` and `application/` for now, `src/shared-kernel/`), one class per
  file. Its tests use `@alveolus/testing` (scenarios, event assertions) and object-literal fakes in
  `test/fakes.ts` (a repository storing snapshots, recording publishers); never classes
  implementing a port outside `driven/`. `test/arch.test.ts` runs `check()` from `@alveolus/arch` on
  it and expects no violation, so `pnpm check` fails when a rule is broken or too strict. Its
  bounded context `index.ts` is a knip entry. When a package gains a feature, use it here too.
- Documentation site: VitePress in `apps/docs` (`@alveolus/docs`), deployed to GitHub Pages
  (https://alveolusjs.github.io/alveolus/) by `.github/workflows/docs.yml` on every push to `main`.
  One documentation, like tsdown.dev: the navbar has a single "Guide" entry and one sidebar, shown
  on every page. The sidebar tree and the file tree are the same (`/core/domain/aggregates` is
  `apps/docs/core/domain/aggregates.md`; an overview is the folder's `index.md`):
  - **Guide** (`guide/`): Introduction, Getting started, Vocabulary.
  - **Core** (`core/`): Overview (install, exports); **Domain** (`core/domain/`): Aggregates,
    Value Objects, Entities, Domain Events, Domain Errors, Domain Services,
    Policies, Repositories; **Application**
    (`core/application/`): Command handlers, Query handlers, Event publishers; **Utilities** (`core/utilities/`):
    Result.
  - **Testing** (`testing/`): Overview, Scenarios, Event assertions.
  - **Arch** (`arch/`): Overview (install, rules table), CLI, Project layout (layout and every
    `*/location` rule); **Rules** (`arch/rules/`): one page per building block with specific rules.
  Core page template: title + 2-3 sentence intro + minimal example (+ an inline SVG diagram when it
  helps, `.al-diagram`) → `## When to use` → `## Usage` (task-oriented `###` recipes) →
  `## Reference` (signature code block, type-parameter table, member table
  `Member | Type | Description`, **Caveats**, import line) → `## Troubleshooting` (runtime errors
  only) → `## See also` (links to its arch rules and testing helpers). Arch rule page template:
  title `<Block> rules` → table rule / ensures → `###` per key rule with a `.al-compare` block with
  ❌ Avoid above ✅ Prefer (stacked, never side by side) and a `::: details Why?` block →
  `## Troubleshooting` (one `###` per CLI message, placeholders as `<Name>`) → `## See also`.
  Testing page template: intro + example → `## Usage` → `## Reference` → `## See also`. Never show
  chapter numbers. `@see` links in JSDoc point to the core page.
  When a package's API changes, update its docs in the same change.
- Docs content rules: document only what exists. One exception: the Vocabulary
  (`apps/docs/guide/vocabulary.md`) defines the DDD terms of IDDD in our own words and marks each
  one `available`, `planned` or `concept` with a badge; update the badges when something ships.
  The Introduction stays short (why, benefits, packages) and links to the Vocabulary instead of
  repeating it. No pages for planned features, no invented APIs
  in examples, no filler (chapter quotes, organisation tables, marketing). Keep
  examples short and consistent (the `Order` aggregate).
- Docs design system (`apps/docs/.vitepress/theme/style.css`): VitePress default theme as on
  tsdown.dev, Inter and system mono, honey palette (`--al-honey-*` tokens mapped to
  `--vp-c-brand-*`). Text and button colours must meet WCAG AA (4.5:1): light mode uses
  `--al-honey-ink` for links and buttons with white text; dark mode uses honey with dark button
  text. Lucide icons inline on feature cards; install commands as pnpm/npm/yarn/bun code groups;
  local search and `/llms.txt` enabled.
- Use TypeScript `private` / `protected`, never ECMAScript `#private` fields.
- **No comments** in code. The only exceptions: `// @ts-expect-error` directives in type-level
  tests (bare, no explanation), and a JSDoc block above every exported building-block class
  (description, `@typeParam`, `@throws`, `@example`, `@see` link to its docs page). JSDoc is kept in
  the published `.d.mts`.
- TypeScript is strict (`tsconfig.base.json`: `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`…). No `any`, no non-null assertions,
  no default exports (except `*.config.ts` and `apps/docs`, where VitePress requires them).
- Build with **tsdown** (ESM, `.mjs` + `.d.mts`). In core and testing, `tsdown.config.ts` turns
  every `src/**/index.ts` into an entry named after its folder (`aggregates/index`), so subpaths
  stay short; arch exposes only `.` and the `alveolus` bin. tsdown writes `exports` (and
  `publishConfig.exports`/`bin`) in each `package.json` on build, so **run `pnpm build` after
  adding a folder** and commit the result. Leaf folder names must be unique within a package.
  Declarations are emitted by oxc thanks to
  `isolatedDeclarations`, so exported APIs need explicit types.
- Versioning and changelogs with **changesets**; packages are published publicly on npm under
  `@alveolus`.
- Tests with Vitest, colocated next to the code in each folder as `*.test.ts`; the
  classes they use live in `test/fixtures/` (own `biome.json` allowing several classes per file); each
  package declares a project in its own `vitest.config.ts` and the root config runs them all.
  Type-level expectations use `// @ts-expect-error`, checked by `pnpm typecheck`.
- Workspace packages resolve to their sources through the `@alveolus/source` export condition
  (generated by tsdown `devExports`; `customConditions` in `tsconfig.base.json`,
  `ssr.resolve.conditions` in Vitest configs), so tests and typecheck never need a build.
- Relative imports use the `.ts` extension (`allowImportingTsExtensions`).

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
2. Add `apps/docs/<name>/index.md` (overview) and a new part in the `sidebar` of
   `apps/docs/.vitepress/config.ts`, mirroring the file tree.

## Open questions

- Composition root: where are driven adapters wired into use cases (`src/main.ts`, per-BC
  `index.ts`)? The layer rules will have to exempt it.
