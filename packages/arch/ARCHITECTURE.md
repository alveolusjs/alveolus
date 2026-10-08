# Architecture of `@alveolus/arch`

This file is for whoever changes the package: what it is made of, where each thing lives, and the
rules the code itself follows. The user documentation lives in `apps/docs/rules/`.

## Bird's eye view

`alveolus arch check` reads a TypeScript project and reports what breaks the architecture Alveolus
describes. It is a pipeline, the same shape as [ArchUnit](https://www.archunit.org/) or
[dependency-cruiser](https://github.com/sverweij/dependency-cruiser): read the code into facts,
read the facts through the conventions, run the rules, report.

```
 TypeScript sources
        │
   ┌────▼─────┐   facts, no opinion: files, classes, members,
   │ importer │   dependencies, statements, throws, globals
   └────┬─────┘
   ┌────▼─────┐
   │  model   │   Project ─ SourceFile ─ ClassDeclaration ─ Member ─ ClassType …
   └────┬─────┘
   ┌────▼──────────┐   conventions/   the tables: layers, building blocks, what core exports
   │ conventions   │
   │ architecture  │   architecture/  the project read through the tables: where a file sits,
   └────┬──────────┘                  what a class is
   ┌────▼─────┐
   │  rules   │   one class per rule: meta (id, messages) + check(architecture) → findings
   └────┬─────┘
   ┌────▼─────┐
   │  check   │   runs the enabled rules, fills the messages, fingerprints each violation,
   └────┬─────┘   applies the baseline, prints the report
        ▼
       cli
```

Each folder depends only on the folders above it. The importer knows TypeScript but nothing of
Alveolus; the rules know Alveolus but nothing of TypeScript's API.

## Code map

```
src/
  bin.ts  index.ts
  model/            Project, SourceFile, and the facts in three families
    classes/        ClassDeclaration, ClassType, Member, Heritage, NamedType, ReturnShape
    dependencies/   Dependency, GlobalUse
    statements/     TopLevelStatement, Throw
  importer/         Importer and ImportScope, the contract
    ts-morph/       TsMorphImporter, the only user of ts-morph
      readers/      one reader per family of facts
  conventions/      data only: layers, building-block places, what core exports
  architecture/     Architecture, the façade the rules use; CoreApi, Layers, BuildingBlocks
    paths/          Layout, Location, Place, LayerShape: where a path sits
  rules/
    framework/      Rule, Finding, Wording, and the templates ClassRule, ImportRule, InjectionRule
    registry.ts     the rule ids and the one list of rules
    strategic/  layers/  tactical/<building block>/
  check/            Checker, Violation, Fingerprint, Baseline, Report
  config/           AlveolusConfig, Config, ConfigLoader
  cli/
test/
  boundaries.test.ts   the import graph between folders
  rules.test.ts        every rule on a realistic project, and the known limits
  support/             TestCodebase, Sandbox, SourceImports
  projects/shop/       a sample project for the CLI
```

### `src/model/`

The facts the importer produces: what the code **is**, not what any rule wants to know. No import
from the rest of the package, no `ts-morph`.

- `Project` holds the analysed `SourceFile`s and finds the declaration of a `ClassType`.
- `SourceFile` holds its `Dependency`s, `ClassDeclaration`s, `TopLevelStatement`s, `Throw`s and
  `GlobalUse`s, and the text of each line.
- `ClassDeclaration` holds its `ClassType` (with its lineage), its `Heritage`, the types it
  implements, and its `Member`s in source order. Questions several rules ask are **queries** here:
  `heldMembers`, `publicSurface`, `isStaticOnly`, `extendsByName`.
- `ClassType` is a class used as a type: its name, the file that declares it, and its lineage, each
  ancestor with the package that declares it. Recognising a building block is left to
  `architecture/`.
- `Dependency` covers every way a file depends on a module: `import`, `export … from`,
  `import("…").T`, `import()`, `require()`, and a global declared by another file of the project.

Invariant: a fact never depends on a rule. Before adding a field for a new rule, look for a query
on existing facts.

### `src/importer/`

`importer.ts` is the contract: `Importer.read(scope)` and `ImportScope`, what to read. `ts-morph/`
is the one implementation, and the only folder that imports `ts-morph`. `TsMorphImporter` reads
each file with one reader per family of facts:

| Reader | Produces |
| --- | --- |
| `DependencyReader` | `Dependency`, resolved to a file of the project (analysed, ignored, unresolved) or a package |
| `ClassReader` | `ClassDeclaration` and its `Member`s |
| `TypeReader` | `ClassType` (deep walk of a type), `NamedType`, `ReturnShape` |
| `StatementReader` | `TopLevelStatement`: functions, enums, namespaces, mutable or computed constants, bare statements |
| `ThrowReader` | `Throw`: `throw` statements and `Promise.reject` calls |
| `GlobalReader` | globals, told apart by where the type checker finds their declaration |

### `src/conventions/`

The architecture Alveolus imposes, as data and nothing else: no class, no import.

- `layers.ts`: the layers, and which layers each one may import.
- `building-blocks.ts`: the place (layer, folder, suffix) of each building block and of each
  marker.
- `core-api.ts`: what `@alveolus/core` exports: building blocks, markers, what the domain and the
  published language may import.

To change a convention, change the table: everything reading it follows. The guide
`apps/docs/guide/project-layout.md` describes the same tables.

### `src/architecture/`

The project read through the conventions. `Architecture` is the façade the rules use:

- where a file sits: `locationOf`, `locationOfTarget`, `shapeIssueOf` (through `paths/`);
- what a class is: `is`, `kindOf`, `kindsOf`, `isBuildingBlock`, `implementsMarker`,
  `returnsResult`, `classOf`;
- the conventions as objects: `core` (`CoreApi`), `layers` (`Layers`), `blocks`
  (`BuildingBlocks`, with `placeOf` and `markedPlacesOf`).

`Settings` is what it needs from the configuration; `Config` implements it. Nothing here produces
text for the user: a problem comes back as data (`ShapeIssue`, `Place`, `Location`), and the rule
words it.

### `src/rules/`

One file per rule, in the folder of what it checks: `strategic/`, `layers/`, and `tactical/` with
one folder per building block. A rule reads top to bottom:

```ts
export class NoPortlessAdapterRule extends ClassRule<"layers/no-portless-adapter", MessageId> {
	public readonly meta = {                       // what it is
		id: "layers/no-portless-adapter",
		description: "…",
		messages: { portless: "{class} is a driven adapter but extends no Port: …" },
	};

	protected findingsFor(codeClass, file, architecture) {   // what it checks
		…
		return [this.finding(file, codeClass.line, codeClass.name, "portless", { class: codeClass.name })];
	}
}
```

`framework/` holds what every rule shares: `Rule` (with `finding(…)` and the `wording` of places
and locations), `Finding`, and three templates that own the iteration: `ClassRule` (each class),
`ImportRule` (each dependency of the files it applies to), `InjectionRule` (what a building block
receives, against an allowlist). A rule that looks across the project, such as one owner per
entity, extends `Rule` directly.

`registry.ts` lists the rule ids, from which `RuleId` derives, and holds the rules. A rule whose
id is not in the list does not compile; an id without a rule fails `registry.test.ts`. The
`rules` section of the configuration schema derives from the same list.

### `src/check/`

What happens after the rules. `Checker` reads the project with an `Importer`, wraps it in an
`Architecture`, runs the enabled rules, and turns each `Finding` into a `Violation`: path relative
to the project, message with its `{placeholders}` filled, and a `Fingerprint` of the reported line.
A placeholder the finding does not fill throws: it is a bug of the rule, and the rule's tests catch
it. `Baseline` keys violations by rule, file, symbol and fingerprint; `Report` writes text or JSON.

### `src/config/`, `src/cli/`

`Config` loads and validates `alveolus.config.ts` with zod, resolves it against the project
directory, and implements `CheckSettings`: the `ImportScope` of the importer, the `Settings` of
the architecture, and the rules turned off. The CLI wires it all with commander.

## A check, end to end

1. `Cli` loads the `Config`.
2. `TsMorphImporter.read(config)` turns every analysed file into a `SourceFile`.
3. `Checker` builds an `Architecture` and calls `check` on each enabled rule.
4. Each rule returns `Finding`s; the checker turns them into `Violation`s, sorted by file and line.
5. `Baseline` removes the known ones; `Report` prints the rest.

## Invariants

Checked by `test/boundaries.test.ts`:

- `ts-morph` is imported in `importer/` only.
- `model/` and `conventions/` import nothing of the package.
- `importer/` imports the model only; `architecture/` the model and the conventions; `rules/` the
  model, the conventions and the architecture.
- Every folder of `src/` is listed, with what it may import.

Followed by the code:

- A rule never formats its own message: it returns a `messageId` and data.
- No text for the user outside `rules/`: the architecture answers with data.
- No loose functions and no static-only classes: every helper is a method of the class that owns
  it; the tables are constants of data.
- Facts are immutable: everything is `readonly`.

## Change it

**Add a rule.** Write `src/rules/<category>/<block>/no-<what>.rule.ts` and its test next to it,
add its id to `ruleIds` and its instance to `RuleRegistry`, and write its page in
`apps/docs/rules/`. The config key and the CLI pick it up from the registry.

**A rule needs a fact the model lacks.** Add the fact to the reader that owns that syntax, and a
case to `ts-morph-importer.test.ts`. Keep it a fact (what the code is); put the interpretation in
`architecture/`.

**Change a convention.** Edit the table in `conventions/` and the guide.

## Testing

- `src/importer/ts-morph/ts-morph-importer.test.ts`: sources in, facts out.
- `src/rules/**/*.rule.test.ts`: one rule on small projects, end to end, through `TestCodebase`.
- `test/rules.test.ts`: every rule on a realistic project (no violation), and one test per known
  limit of the rules.
- `test/boundaries.test.ts`: the invariants above.
- `src/cli/cli.test.ts`: the CLI on `test/projects/shop`, copied into a sandbox.
