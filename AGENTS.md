# AGENTS.md

Working guide for agents (and humans) on the **Harness**.

## Project goal

Turn _Implementing Domain-Driven Design_ (Vaughn Vernon, 2013) into **Alveolus**: short, numbered TypeScript / NestJS rules that can be checked in code review, and the tools to build any app with them. Nothing here knows a particular app.

The repository has two parts: `docs/`, the site, and `packages/`, what an app installs.

- `docs/`: the **Alveolus** site, its DDD and architecture rules, a VitePress site **published publicly** at [alveolus.dev](https://alveolus.dev/);
- `packages/core/`: `@alveolus/core` on npm, the building blocks of DDD for TypeScript (aggregates, entities, value objects, events, ports, handlers, outbox, `Result`), with no runtime dependency;
- `packages/claude-rules/`: the package `@alveolus/claude-rules` on npm, which installs in an app the approved rules as Claude Code path-scoped rules, and the skills to design, implement and review a user story with them;
- `packages/claude-plugin/`: the Claude Code plugin `alveolus`, its skills and agents;
- `packages/context-mapper/`: validates a context map written in CML and draws it (Context Mapper CLI in Docker), for any app;
- `ebooks/`: the reference book, **local only** (ignored by Git).

## Plan

### Write the rules, chapter by chapter

One chapter at a time. For each: read the chapter in `ebooks/`, draft the rules, then review them with the user. On the site, rules are organized by theme (`docs/.vitepress/themes.ts`), not by chapter: this table only tracks the drafting.

| Ch. | Title | Status |
| --- | --- | --- |
| 1 | Getting Started with DDD | **drafted** |
| 2 | Domains, Subdomains, and Bounded Contexts | **drafted** |
| 3 | Context Maps | **drafted** |
| 4 | Architecture | **drafted** |
| 5 | Entities | **drafted** |
| 6 | Value Objects | **drafted** |
| 7 | Services | **drafted** |
| 8 | Domain Events | **drafted** |
| 9 | Modules | **drafted** |
| 10 | Aggregates | **drafted** |
| 11 | Factories | **drafted** |
| 12 | Repositories | **drafted** |
| 13 | Integrating Bounded Contexts | **drafted** |
| 14 | Application | **drafted** |
| A | Aggregates and Event Sourcing: A+ES | **dropped**: event sourcing is out of the rules |

The rules were then regrouped by theme and renumbered so that each prefix belongs to one theme (`themes.ts`): 196 rules, including CTX-14 and the Transaction scripts theme (TXS-01 to TXS-08), which go beyond the book. The architecture and placement part was then regrouped in three axes: structure (LAY, PLC, NAM, WIR), flow (UC, API, PER) and proof (TST). Under way: the translation into French and the review of each rule, theme by theme. Left to do: a cross-cutting review (consistency of cross-references, severities).

### Build apps with these rules

Apps live in their own repositories. They opt in to the `alveolus` plugin with a `harness.md` at their root (see "Plugin"). Every deviation from a rule is a documented waiver. Every `deterministic` rule is meant to be automated in an app's CI: a rule fully checked by the tooling is `fitness`; a rule partly checked is `hybrid` with a `fitness` field. The tooling is not delivered yet: no rule carries a `fitness` field until it is.

## Writing a rule

The site's content lives in `docs/src/` (VitePress `srcDir`): `index.md` (home), `start/` (overview and how to read a rule, reference architecture, default choices, project setup with its prerequisites and tooling, glossary, about) and `rules/` (the index of all rules, and the four parts). One rule = one file `docs/src/rules/<part>/<theme>/<lowercase-code>.md`, for example `docs/src/rules/domain-logic/aggregates/agg-06.md`.

```md
---
code: AGG-06
title: Une transaction ne modifie qu’une instance d’aggregate
group: Transactions et cohérence
scope: [application, driving]  # domain | application | driving | driven | public | schema | tests | structure
style: [tactical]             # tactical | transaction-script, one or both
severity: major               # blocking | major | minor | question
severityNote: ...             # optional, severity nuance
detection: hybrid             # deterministic | hybrid | LLM | fitness
detectionNote: ...            # optional, tool or method
context: ...                  # optional, the rule only applies if this style is adopted
fitness: ...                  # optional, what the tooling already checks
review: to-review              # to-review | approved | rejected
reviewNotes:                  # optional, why it was approved with changes or rejected
  - ...
sources:                      # book section titles, behind the scenes: never shown on the site
  - "Rule: Model True Invariants in Consistency Boundaries"
---

# AGG-06 · Une transaction ne modifie qu’une instance d’aggregate

<RuleMeta />

## Signal
## Pourquoi
## Exceptions
## Correction
## Adaptation      (optional: what is specific to TypeScript / NestJS, and "Notre choix")
## Voir aussi      (optional: link to a neighboring rule, avoid duplicates)
## Exemple         (optional)
```

- Each theme has an `index.md` with a short introduction and `<RuleTable />`. Themes, their order, their prefix, their summary and their part are declared in `docs/.vitepress/themes.ts`.
- Themes are grouped in four **parts**, declared in `docs/.vitepress/parts.ts`. Each part is a folder of `src/rules/` holding its page (`index.md`) and the folders of its themes: `strategic-design/`, `domain-logic/`, `architecture-and-placement/`, `integration/`. Rule URLs follow the folders: `/rules/<part>/<theme>/<code>`. A theme's `part` in `themes.ts` must match the folder it lives in.
- A theme is `written` or `coming`. A `coming` theme reserves its prefix and shows, greyed, on the part pages, but not in the sidebar. It becomes `written` with its folder under its part, its `index.md` and its first rule. The site build fails when two themes share a prefix, a theme names an unknown part, or a status does not match the folder.
- Each theme overview has an **In practice** section, between its introduction and its rule table: a short example written in the page, and the rules it shows. There is no example project: code examples live in the Markdown. The context map of the strategic design part is `docs/src/rules/strategic-design/context-map/payment-services.cml`, drawn by `pnpm context-map`.
- Sidebar, tables and the global index are **generated** from the frontmatter: maintain nothing by hand.
- Translating a page also translates its entry in the sidebar, in the same change: a rule through its `title`, a part or theme overview through `menu: Vue d’ensemble` in its frontmatter (the sidebar shows `Overview` without it), along with the `title` and `group` of every rule listed under that theme, and the rule's `#` heading to match, a page of the `start` section or `choosing-a-style` through its label in `rulesSidebar()` (`.vitepress/rules.ts`).
- Every rule says which **implementation style** it applies to: `tactical` (core contexts, tactical DDD), `transaction-script` (supporting and generic contexts), or both. The site shows it as a badge, and a global filter in the top bar (All, Tactical, Transaction script), remembered by the browser, narrows the sidebar, the tables, the index and the home page to the rules that apply to one style, shared rules included; a rule outside the filter stays reachable with a banner. The site build fails on a rule without a valid `style`. Themes of the tactical model are `tactical`; the strategic, integration and architecture themes apply to both unless a rule targets the model itself.
- Every rule carries a **review verdict**: `to-review` (⚠️) until the user has read it, `approved` (✅) once kept, `rejected` (❌) when it leaves the rules. A rejected rule keeps its page and its code, so the code is never reused. The sidebar, the rule tables and the index show the verdict; the index filters by it and counts each. The site build fails on a rule without a valid `review`. Only the user changes a verdict.
- Writing a rule code (`AGG-04`) in any page is enough: it becomes a link automatically.
- Groups (`group`) structure the theme; rules of the same group follow each other in the numbering.

### Editorial constraints

- **The site is public and self-contained**: no reference to a particular app, its repository or its code, and no numbered ADR (`ADR-0002`): those are an app's decisions. The notion of an ADR stays.
- **Examples need no business knowledge**: everyday banking notions only (money, a wallet, a balance, a deposit, a withdrawal, a customer). No payment scheme, message format, regulation or figure that a reader could find wrong: a false business detail discredits the rule it illustrates.
- **The book is cited only once**, on the "About" page. In rules and site pages: no "the book", no "the appendix", no chapter number, no author name, no case study, no example taken from the case study (agile project management, collaboration forum, identity and access). State the principle directly, in the present tense.
- **No reference to Java or its ecosystem** (Hibernate, Spring, JavaBeans…). Only what holds in TypeScript / NestJS / Node belongs here.
- **Never reproduce a passage of the book.** Rephrase. Section titles stay in the `sources` field, behind the scenes, to find the passage when a rule evolves.
- The rules are **our** rules: DDD adjusted to NestJS and to our choices. A default choice is written in the Adaptation, in a paragraph starting with **Notre choix**, and is listed on the Default choices page (`docs/src/start/default-choices.md`). Code examples follow these choices (`Result`, Prisma, Unit of Work).
- Written in French, short sentences (being translated from English, one theme at a time). Technical and literature terms stay in English, lowercase in prose (aggregate, value object, bounded context…): the list, their gender, plural and the French section titles of a rule are on the glossary page (`docs/src/start/glossary.md`). Add a term there before using it. Always write "bounded context" in full, never "contexte" alone.
- Examples in TypeScript / NestJS, with everyday banking notions (see above). Code in examples follows the layout of the reference architecture: braces on every block, a blank line after every block, lines of 120 characters at most, private `#` fields, no comments except a line that stands for code left out.

## Plugin

The plugin `alveolus` (`packages/claude-plugin`) builds any app that follows the rules, slice by slice, from that app's product documentation. The repository is its marketplace (`.claude-plugin/marketplace.json`, name `harness`), enabled here by `.claude/settings.json`. An app adds it with `/plugin marketplace add alveolusjs/alveolus`. It grows one brick at a time; its README lists the bricks and what comes next.

- Skills, run by the user, who reviews between steps: `/alveolus:spec`, `/alveolus:design`, `/alveolus:tasks`, `/alveolus:build`, `/alveolus:verify`. The spec `status` follows: `draft`, `approved`, `designed`, `planned`, `building`, `done`.
- Agent `alveolus:reviewer`: reviews a change against the rules whose detection is `LLM` or `hybrid`.
- An app opts in with a `harness.md` at its root: where its documentation, catalog, slices and rules are, how to read an entry, how an entry ships, its checks and its conformance test. Nothing specific to an app goes into this repository.

## Language

- **The repository is in English**: configuration, scripts, the plugin, AGENTS.md, the README and commit messages.
- **Exception: the site** (`docs/`) is in French, keeping technical and literature terms in English as its glossary lists them. Its code, frontmatter keys and values, and the code in its examples stay in English.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/) format: `type(scope): description` in the imperative, lowercase, no trailing period.
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`. Usual scopes: `rules`, `docs`, `core`, `claude-rules`, `plugin`, `context-mapper`.
- The body explains the why, in lines of 72 characters at most.
- Every commit references its GitHub issue in the [Harness project](https://github.com/users/Jeremy-Fleury/projects/10): `Refs #N` in the body, or `Closes #N` in the commit that finishes it. Work that has no issue gets one before it is committed.

## Commands

```sh
pnpm install
pnpm docs:dev       # the site
pnpm check          # Biome (lint + format) — pnpm check:fix to fix
pnpm typecheck      # TypeScript, package by package
pnpm test           # the tests of the packages
pnpm context-map    # validates and draws the context map of the rule examples (Context Mapper CLI in Docker)
pnpm build          # the site, @alveolus/core, and the rules of claude-rules
```

Before handing back: `pnpm check && pnpm typecheck && pnpm test && pnpm build`.

- `@alveolus/core` keeps its own TypeScript settings (`packages/core/tsconfig.json`): strict, with `isolatedDeclarations`. Its type assertions are deliberate, so `noUnsafeTypeAssertion` is off for it in `biome.json`.

## Releases

`@alveolus/core` and `@alveolus/claude-rules` are published on npm; the plugin and `context-mapper` are not.

- A pull request that changes what a package ships adds a changeset: `pnpm changeset`, the package, the bump and one line a user can read. A change no user will notice adds an empty one: `pnpm changeset --empty`.
- `@alveolus/claude-rules` ships the approved rules of `docs/src/rules/`: a pull request that changes an approved rule, or approves one, needs a changeset for it. CI checks it.
- On `main`, the release workflow opens a "Version packages" pull request; merging it publishes to npm with provenance. Never bump a version or publish by hand.

## Watch out

- **pnpm 11** rejects recently published versions by default (`minimumReleaseAge`). Pick a slightly older version rather than adding exceptions.
- `ebooks/` is never committed, nor cited beyond section titles.
