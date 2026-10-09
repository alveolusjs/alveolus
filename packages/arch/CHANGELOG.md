# @alveolus/arch

## 0.5.0

### Minor Changes

- 608904a: Code loaded at runtime counts as an import the analysis does not see, refused in every file: an import of `node:module` (`createRequire`) or `node:vm`, `module.require`, `process.getBuiltinModule`, `eval`, `Function` and `new Function`. `createRequire(import.meta.url)` in an adapter, or `new Function("s", "return import(s)")` in the domain, loaded another context with no rule noticing. `strategic/no-cross-context-import` reports it in any context, `layers/no-outward-import` from a file at the root or a composition root. To read a JSON file, import it with `with { type: "json" }`.
- 66d06f5: New rule `strategic/no-shared-state`, reported as an error: a static field of the shared kernel without `readonly`, or holding a collection (a `Map`, a `Set`, a mutable array, an index signature, an object literal). A `ServiceRegistry` in the shared kernel let two contexts call each other with no import and no line in the context map. Constants such as `static readonly ZERO = new Money(…)` stay allowed.
- 1325f97: A `/// <reference path="…" />` or `/// <reference types="…" />` directive and a `declare module "…"` augmentation count as imports, for every rule that checks imports. A reference to a file of another bounded context went unnoticed, and an augmentation of another context's file was only reported in the domain, by `tactical/no-loose-code`.
- 9897c4c: A file the analysis does not see (ignored, unresolved, computed at runtime, or outside the declared contexts and the shared kernel) can no longer relay another bounded context. An ignored `wiring.fixture.ts` that re-exported another context carried the import past every rule. `layers/no-outward-import` now reports such an import from a composition root or a file at the root of `src/`, and `strategic/no-cross-context-import` reports it from any file of a context, whatever its subdomain, or of the shared kernel. To fix it, move the file into a context, the shared kernel or a package, or record it in the baseline.
- 5f3ab92: The wiring counts as a dependency. In the composition roots and the files at the root of `src/`, a value of one context given to another (an argument, a property, the body of an arrow function, an assignment, a typed variable) is read through the type checker: `strategic/no-unmapped-context` reports it when the context map does not allow the receiving context to consume the giving one, and `strategic/no-cross-context-import` when it is not an open host service. `new LedgerModule({ redemptions: () => this.emoney.commands.requestRedemption })` in `app.module.ts` tied two contexts with no import between them. `ImportScope` gains `readsWiring(path)`.

## 0.4.0

### Minor Changes

- 4e2504f: The context map is required, and reads as sentences. `contextMap` in `alveolus.config.ts` lists every bounded context with the contexts it consumes: `{ ledger: { consumes: [] }, payments: { consumes: ["ledger"] } }`. A context left out, a context that consumes itself or a cycle fails the configuration. `strategic/no-unmapped-context` no longer has a mode without a map, and tells to reverse a dependency before adding it to the map. To migrate, turn `{ payments: ["ledger"] }` into `{ ledger: { consumes: [] }, payments: { consumes: ["ledger"] } }`, and add `consumes: []` for each context the old map left out.

## 0.3.0

### Minor Changes

- e2d804c: The documentation ships with the package: `npx alveolus explain <topic>` prints a rule, a building block or a guide in the terminal, and `npx alveolus init` writes `alveolus.config.ts` with the instructions that tell a coding agent to read it there.

## 0.2.0

### Minor Changes

- 7f55271: Classify bounded contexts as core, supporting or generic. `subdomains` in `alveolus.config.ts` lists every context under one of the three; a context left out fails the configuration. A core context and the shared kernel are checked by every rule. A supporting or generic context is checked at its boundary only: the `strategic/` and `tooling/` rules apply, the `layers/` and `tactical/` ones do not. `strategic/no-cross-context-import` asks for an anti-corruption layer in a core context only; a supporting or generic context imports the open host service of another context from anywhere.

## 0.1.0

### Minor Changes

- The first release out of alpha.
  
  Rules: `strategic/no-cross-context-import`, `strategic/no-leaky-host-service`,
  `strategic/no-unmapped-context`, `strategic/no-fat-shared-kernel`, `layers/no-impure-domain`,
  `layers/no-outward-import`, `layers/no-portless-adapter`, `layers/no-driving-shortcut`,
  `tactical/no-aggregate-reference`, `tactical/no-public-field`,
  `tactical/no-foreign-command-dependency`, `tactical/no-foreign-query-dependency`,
  `tactical/no-stateful-service`, `tactical/no-thrown-failure`, `tactical/no-misplaced-class`,
  `tactical/no-loose-code`, `tooling/no-loose-disable`.
  
  The checks read every form of import, the globals a file uses, and follow types in depth. Each
  rule reports an error by default; the configuration lowers it to `warn` or `info`, or turns it
  off. A baseline records the violations of an existing project and refuses to grow; a disable
  comment turns one violation off, with a reason. Output as text grouped by file, JSON, or SARIF.
  Configuration: `boundedContexts`, `sharedKernel`, `contextMap`, `compositionRoot`,
  `domainDependencies`, `applicationDependencies`, `ignore`, `layout.extraFolders`, `tsconfig`,
  `rules`. Node.js 24 or later.
