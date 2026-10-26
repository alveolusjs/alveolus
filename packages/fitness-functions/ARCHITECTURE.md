# Architecture

How `@alveolus/fitness-functions` reads an app and checks it. Read it before changing the package; `CONTRIBUTING.md`
at the root of the repository says how to add a fitness function.

## From a test to violations

```txt
FitnessFunctions.of(root)
├── layout/ArchitectureReader     architecture.json → bounded contexts, their style and folder
└── codebase/Codebase.read        every file of src/ and of the declared folders → facts
fitness.check('LAY-04')
├── project/Project.seenBy        the files of the bounded contexts of the rule's styles
├── rules/…/Lay04.check           facts + layout → violations
└── violations/Violation          code, title, url, file, line, message
```

`of()` reads everything once. Each `check()` gives one fitness function the part of the app its styles cover.

## Folders

| Folder | Role | Reads |
| --- | --- | --- |
| `codebase/` | Reads the code of the app and states facts about it: files, their imports and where they resolve. The only folder that imports oxc. | nothing else |
| `layout/` | Interprets the app against the reference architecture: bounded contexts, styles, folders. | `codebase` |
| `project/` | What one fitness function sees: the files of the bounded contexts of its styles, and where any file sits. | `codebase`, `layout` |
| `rules/` | One fitness function per automated rule, in the tree of the site, with the registry. | `layout`, `project`, `violations` |
| `violations/` | What a fitness function reports. | `rules` |

`src/__test__/boundaries.test.ts` reads the package with its own `Codebase` and fails on any other dependency, and on
an import of oxc outside `codebase/`.

## Principles

1. **Only `codebase/` reads the code.** A fitness function never sees a syntax tree, only facts. The AST of oxc is
   still 0.x: when it changes, only `codebase/` changes.
2. **Facts are neutral.** A fact says what the code is (this file imports that one, at that line), never what a rule
   looks for. A new fact is added when a rule needs it, named for what it is, and serves every later rule. No flag per
   rule, such as `isLeakyPublicFile`.
3. **`layout/` interprets.** Bounded contexts, folders and styles come from `architecture.json` and the reference
   architecture, in one place. A fitness function asks `project.placementOf(path)`, never splits a path itself.
4. **Fail loudly.** When the app cannot be read as TypeScript reads it, `of()` throws: no fitness function passes on
   a project it could not read. Violations are only what rules report.
5. **No false positives.** A fitness function reports only what it can decide. What it cannot decide stays for
   review, and its `Rule` says so with `coverage: 'partial'`.

## Growing the model

`TRIAGE.md` lists the facts each rule needs. They arrive in this order, each when the first rule that needs it is
written:

| Fact | Rules | State |
| --- | --- | --- |
| `paths` | 111 | here: `SourceFile.path`, `project.placementOf` |
| `imports` | 53 | here: `Dependency` |
| `syntax` | 88 | next: what each file declares (classes, members, decorators, exports, calls) |
| `heritage` | 52 | then: a name followed to its declaration in another file |
| `config` | 15 | one reader per file kind, when a rule needs it: the context map, `CODEOWNERS`, the Prisma schema |
| `types` | 4 | last, if ever: the TypeScript compiler, behind the same `codebase/` boundary |

## Tests

- **Each fitness function** starts from the reference app (`src/__test__/support/reference-app.ts`), a small app that
  follows every rule, adds the files of one case inline, and checks the exact violations.
- **`reference-app.test.ts`**: every fitness function accepts the reference app.
- **`registry.test.ts` and `triage.test.ts`**: every fitness function matches its page on the site and its row in
  `TRIAGE.md`.
- **`boundaries.test.ts`**: the folders keep the dependencies above.
