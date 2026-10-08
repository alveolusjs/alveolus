# Contributing to `@alveolus/arch`

`@alveolus/arch` reads a TypeScript project and reports what breaks the architecture Alveolus
describes. This guide gets you from a clone to a merged rule. For the map of the code and the
reasons behind it, read [ARCHITECTURE.md](./ARCHITECTURE.md) first: it is short, and everything
below assumes it.

## Set up

Node 24 and pnpm 11 (the versions in the root `package.json`).

```sh
pnpm install
pnpm check          # lint, typecheck, dead code, tests: what CI runs
```

Day to day, from the repository root:

| Command | What it does |
| --- | --- |
| `pnpm test` | Every test of every package |
| `pnpm vitest run packages/arch` | The tests of this package |
| `pnpm vitest run packages/arch/src/rules/layers` | The tests of one folder, or one file |
| `pnpm vitest` | Watch mode |
| `pnpm lint:fix` | Biome: formatting and lint, fixed in place |
| `pnpm typecheck` | `tsc` on every package |
| `pnpm knip` | Unused files, exports and dependencies |
| `pnpm docs:dev` | The documentation site, with live reload |

The CLI runs from the sources without a build, with `jiti`:

```sh
cd packages/arch
pnpm exec jiti src/bin.ts arch check --project test/projects/shop
```

## How a check works

```
alveolus.config.ts ──▶ Config
                          │
TypeScript sources ──▶ TsMorphImporter ──▶ Project (facts) ──▶ Architecture (facts + conventions)
                                                                      │
                                             Rule.check(architecture) ──▶ Finding[]
                                                                      │
                                                  Checker ──▶ Violation[] ──▶ Baseline ──▶ Report
```

Three ideas carry the whole package:

1. **The importer produces facts, not opinions.** `model/` says what the code *is*: files, classes,
   members, dependencies. It knows nothing of layers or aggregates.
2. **The conventions are data.** `conventions/` holds the tables of what Alveolus expects: layers
   and their directions, the folder of each building block, what `@alveolus/core` exports.
   `architecture/` reads the facts through those tables and answers the questions rules ask:
   *where does this file sit? what is this class?*
3. **A rule finds, the checker tells.** A rule returns findings with a message id and data; the
   checker fills the message, fingerprints the line, and the baseline and report take it from
   there. A rule never formats text for the user.

## Add a rule

A rule is one file, its test, its id in the registry, and its documentation page. Say we want to
report a domain event whose payload holds an entity instead of plain data.

### 1. Name it

Rule ids follow `<category>/no-<what is reported>`: `tactical/no-entity-in-event`. The categories are
`strategic` (what crosses a bounded context), `layers` (what each layer may depend on) and
`tactical` (how building blocks are written). A tactical rule goes in the folder of the building
block it checks: `src/rules/tactical/domain-events/`.

### 2. Write it

```ts
// src/rules/tactical/domain-events/no-entity-in-event.rule.ts
import type { Architecture } from "../../../architecture/index.ts";
import type { ClassDeclaration, SourceFile } from "../../../model/index.ts";
import type { Finding, RuleMeta } from "../../framework/index.ts";
import { ClassRule } from "../../framework/index.ts";

export class NoEntityInEventRule extends ClassRule<"tactical/no-entity-in-event", "entity"> {
	public readonly meta: RuleMeta<"tactical/no-entity-in-event", "entity"> = {
		description: "A domain event whose payload holds an entity.",
		id: "tactical/no-entity-in-event",
		messages: {
			entity: "{class} holds the entity {type} in its {parameter}: an event carries plain data; copy the values it needs.",
		},
	};

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<"entity">[] {
		if (!architecture.is(codeClass, "DomainEvent")) {
			return [];
		}
		const findings: Finding<"entity">[] = [];
		for (const argument of codeClass.typeArguments) {
			for (const type of argument.types) {
				if (architecture.is(type, "Entity")) {
					findings.push(this.finding(file, argument.line, codeClass.name, "entity", { class: codeClass.name, parameter: argument.parameter, type: type.name }));
				}
			}
		}
		return findings;
	}
}
```

What to notice:

- `meta` comes first and reads like the documentation page: the id, what is reported, the
  messages. Every `{placeholder}` of a message is filled by the `data` of a finding; the checker
  throws on one left unfilled, so a typo fails your tests.
- The rule asks the `Architecture`, never `ts-morph`: `architecture.is(…)`, `architecture.locationOf(…)`,
  `architecture.blocks.placeOf(…)`. Here `codeClass.typeArguments` gives what the class passes to
  `DomainEvent<Id, Payload>`, and `argument.types` the classes found in it, however deep: `OrderLine[]`
  or `{ lines: OrderLine[] }` both count. If the question you need is not there, see
  [Add a fact](#add-a-fact-or-a-question) below.
- `this.finding(file, line, symbol, messageId, data)` builds a finding. The `symbol` is what the
  baseline keys on, together with the file and the line's fingerprint: pick something stable, such
  as `Order.customer` rather than a sentence.
- Three templates own the iteration so that you write only the check: `ClassRule` (each class),
  `ImportRule` (each dependency of the files it applies to), `InjectionRule` (what a building block
  may receive, against an allowlist). A rule that looks across files, such as one owner per entity,
  extends `Rule` and loops over `architecture.files` itself.

### 3. Test it

Tests sit next to the rule and go through `TestCodebase`, an in-memory project with
`@alveolus/core` installed:

```ts
// src/rules/tactical/domain-events/no-entity-in-event.rule.test.ts
import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../test/support/test-codebase.ts";
import { NoEntityInEventRule } from "./no-entity-in-event.rule.ts";

const ids = `import { Identifier } from "@alveolus/core";
export class OrderId extends Identifier<string, "OrderId"> {}
export class LineId extends Identifier<string, "LineId"> {}`;

describe("NoEntityInEventRule", () => {
	it("accepts a payload of plain data", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/value-objects/ids.ts", ids).file(
			"src/ordering/domain/events/order-placed.event.ts",
			`import { DomainEvent } from "@alveolus/core";
			import type { OrderId } from "../value-objects/ids.ts";
			export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}`,
		);

		expect(codebase.check(new NoEntityInEventRule())).toEqual([]);
	});

	it("rejects an entity in the payload", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/value-objects/ids.ts", ids)
			.file(
				"src/ordering/domain/entities/order-line.entity.ts",
				`import { Entity } from "@alveolus/core";
				import type { LineId } from "../value-objects/ids.ts";
				export class OrderLine extends Entity<LineId> { toSnapshot() { return { id: this.id.value }; } }`,
			)
			.file(
				"src/ordering/domain/events/order-placed.event.ts",
				`import { DomainEvent } from "@alveolus/core";
				import type { OrderLine } from "../entities/order-line.entity.ts";
				import type { OrderId } from "../value-objects/ids.ts";
				export class OrderPlaced extends DomainEvent<OrderId, { lines: OrderLine[] }> {}`,
			);

		expect(codebase.messages(new NoEntityInEventRule())).toEqual([
			"OrderPlaced holds the entity OrderLine in its Payload: an event carries plain data; copy the values it needs.",
		]);
	});
});
```

`check(rule)` returns `file:line symbol` for each violation, `messages(rule)` the messages,
`checkAllRules()` runs every rule. Cover at least: the good case, each message, and the bypass you
would try as a reviewer (the entity behind a type alias, inside an array, in a nested object).

To see what the importer reads from a snippet, `codebase.readFile(path)` returns the `SourceFile`
with its classes, members and dependencies: the quickest way to find out why a rule does not fire.

### 4. Register it

In `src/rules/registry.ts`, add the id to `ruleIds` and the instance to `RuleRegistry.rules`, in
the same position. Do it before running the test above: `TestCodebase.check` takes a `Rule<RuleId>`,
so a rule whose id is missing from `ruleIds` does not compile, and an id without a rule fails
`registry.test.ts`. The `rules` section of `alveolus.config.ts` and the CLI pick the rule up
from there: nothing else to wire.

### 5. Document it

Every rule has a page in `apps/docs/rules/<category>/<id>.md`, and users read it before they read
the code. Copy a sibling page and keep its sections, in this order:

| Section | What it says |
| --- | --- |
| At a glance | Rule, category, what it reports, what it applies to, how to turn it off |
| Why | A concrete broken rule, then the fix in a `::: tip` |
| What it checks | The exact conditions, as a table or cards |
| What it reports | The messages, as the CLI prints them |
| Fix it | `❌ Avoid` / `✅ Prefer` pairs |
| Limits | What static analysis cannot see, and what to watch for in review |
| Turn it off | The config snippet, and a word on the baseline |
| See also | The building blocks it checks, related rules |

Then add the page to the sidebar in `apps/docs/.vitepress/config.ts`, to the table in
`apps/docs/rules/index.md`, and to the *Checked by* row of the building-block pages it applies to
(`apps/docs/core/**`). `pnpm docs:dev` shows the result; the build fails on a dead link.

### 6. Check in

`pnpm check` green, and a commit that says what the rule reports: `feat(arch): report a Date in an
event payload`.

## Add a fact, or a question

A rule may need something the model does not say yet. Keep the two levels apart:

- **A fact is what the code is**: a member, a dependency, a `throw`. It belongs in `model/`, and
  the reader that owns that syntax produces it (`importer/ts-morph/readers/`). Add a case to
  `ts-morph-importer.test.ts`: sources in, facts out. A fact never mentions a rule or a layer.
- **A question is what a rule wants to know**: *is this class a bag of static helpers? what does
  this open host service expose?* It is a query on existing facts, as a getter or a method of
  `ClassDeclaration`, `SourceFile` or `Architecture`. Before adding a field to the model for a new
  rule, look for a query.

When the question involves Alveolus, such as *is this class an aggregate?*, it belongs to
`architecture/`, which reads the facts through the conventions.

## Change a convention

The folders, suffixes and layers Alveolus expects are tables in `src/conventions/`: change the
table, and every rule reading it follows. Update the guide `apps/docs/guide/project-layout.md` in
the same change, and the `test/projects/shop` sample if it no longer fits.

## Messages

Messages are read by developers in a terminal and by agents in CI, often without the page. Each
one says what was found, then what to do instead, after a colon:

```
Order.customer holds the aggregate Customer: reference it by its identifier instead.
```

Name the symbol, name the building block, keep to one sentence, and do not repeat the rule id,
which the report prints already. The wording of places and locations (`domain/aggregates/*.aggregate.ts`,
`ordering driven`) comes from `rules/framework/wording.ts`, so that every rule names them the same
way.

## The code itself

The package follows what it teaches. `test/boundaries.test.ts` and Biome enforce most of it; the
rest is review.

- **Each folder has one role, and imports only the folders above it** in the pipeline. The allowed
  graph is in `test/boundaries.test.ts`; a new folder goes there.
- **`ts-morph` stays in `importer/`.** Rules, conventions and the model never see it.
- **No loose functions.** A helper is a method of the class that owns it. Tables are `as const`
  data; there are no classes made of static members.
- **Readable over clever.** Loops and early returns rather than nested `flatMap` and ternaries;
  small methods with a name that says what they answer; a one-line comment where the *why* is not
  obvious.
- **Immutable by default.** `readonly` on every field and every member of a data type; `private`
  unless something outside needs it.
- **Tests next to the code.** `x.test.ts` beside `x.ts`; the few tests of the package as a whole
  live in `test/`.

## Before you open a pull request

- `pnpm check` is green.
- A new rule has its test, its page, its sidebar entry and its *Checked by* mentions.
- A changed message has its page updated: users copy messages into issues.
- A renamed rule id has no alias: the package is in alpha, and the documentation says so.
