# @alveolus/arch

## 0.6.0

### Minor Changes

- 5164b5d: Code loaded at runtime is recognised by its type, not only by its name: an alias of `Function` or `eval`, the `constructor` of a function (`(() => 0).constructor`, the `AsyncFunction` constructor), `Reflect.construct(Function, …)`, and a lookup on `globalThis`, `global`, `window` or `self` whose key is computed, such as `Reflect.get(globalThis, name)`. The documentation said `new Function` and `eval` were reported; written without their names, they were not. The message of `strategic/no-unmapped-context` now says how to reverse a dependency, with an integration event and not with a callback, and the page of `strategic/no-shared-state` no longer claims that an instance field is never shared.
- 1a28391: `strategic/no-leaky-host-service` reports an open host service that receives a function, at any depth of its parameters (a callback, an options object with a handler, an array of listeners), or returns `unknown`, `any` or `object`. An `onRestockNeeded(callback)` on the catalog's open host service let it run code of another context while the context map said it consumed nothing, and a result typed `unknown` let a live aggregate leave the context. To let another context react, publish an integration event. A parameter may still be `unknown`, for a payload to validate.
- 3a41260: In the wiring, a module of another context is read by its properties only. `strategic/no-cross-context-import` reports a composition root or a file at the root of `src/` that reaches into such a module with brackets, `Reflect.get`, a spread, destructuring, or by passing it to a function that could hand back anything, such as a helper or lodash `get`. `Reflect.get(Reflect.get(this.catalog, "commands"), "changePrice")` gave a handler of the catalog to ordering with a type the analysis could not follow. A module handed whole to the constructor of another module stays allowed.
- 65fb593: `strategic/no-shared-state` reports a static readonly field of the shared kernel that holds anything but a value. A value is a primitive, a value object, an identifier, a class of a package listed in `domainDependencies`, or a readonly collection of them. A singleton such as `static readonly shared = new ServiceDirectory()`, a `static readonly bus = new EventEmitter()` or a function kept its state out of the rule's sight, since it read the type of the field and not what its class holds. Build such services in the composition root.
- de602c6: `strategic/no-cross-context-import` reports a name of `globalThis`, `global`, `window` or `self` that no file declares, written or read: an assignment, `Reflect.set`, `Reflect.get`, `Object.assign`, `Object.defineProperty` or `(globalThis as any).x`. `Reflect.set(globalThis, "catalog:prices", handler)` in one context and `Reflect.get` in another let them call each other with no import. A name the library declares, such as a polyfill of `globalThis.crypto`, stays allowed.

## 0.5.0

### Minor Changes

- 608904a: Code loaded at runtime counts as an import the analysis does not see, refused in every file: an import of `node:module` (`createRequire`) or `node:vm`, `module.require`, `process.getBuiltinModule`, `eval`, `Function` and `new Function`. `createRequire(import.meta.url)` in an adapter, or `new Function("s", "return import(s)")` in the domain, loaded another context with no rule noticing. `strategic/no-cross-context-import` reports it in any context, `layers/no-outward-import` from a file at the root or a composition root. To read a JSON file, import it with `with { type: "json" }`.
- 66d06f5: New rule `strategic/no-shared-state`, reported as an error: a static field of the shared kernel without `readonly`, or holding a collection (a `Map`, a `Set`, a mutable array, an index signature, an object literal). A `ServiceRegistry` in the shared kernel let two contexts call each other with no import and no line in the context map. Constants such as `static readonly ZERO = new Money(…)` stay allowed.
- 1325f97: A `/// <reference path="…" />` or `/// <reference types="…" />` directive and a `declare module "…"` augmentation count as imports, for every rule that checks imports. A reference to a file of another bounded context went unnoticed, and an augmentation of another context's file was only reported in the domain, by `tactical/no-loose-code`.
- 9897c4c: A file the analysis does not see (ignored, unresolved, computed at runtime, or outside the declared contexts and the shared kernel) can no longer relay another bounded context. An ignored `wiring.fixture.ts` that re-exported another context carried the import past every rule. `layers/no-outward-import` now reports such an import from a composition root or a file at the root of `src/`, and `strategic/no-cross-context-import` reports it from any file of a context, whatever its subdomain, or of the shared kernel. To fix it, move the file into a context, the shared kernel or a package, or record it in the baseline.
- 5f3ab92: The wiring counts as a dependency. In the composition roots and the files at the root of `src/`, a value of one context given to another (an argument, a property, the body of an arrow function, an assignment, a typed variable) is read through the type checker: `strategic/no-unmapped-context` reports it when the context map does not allow the receiving context to consume the giving one, and `strategic/no-cross-context-import` when it is not an open host service. `new OrderingModule({ prices: () => this.catalog.commands.changePrice })` in `app.module.ts` tied two contexts with no import between them. `ImportScope` gains `readsWiring(path)`.

## 0.4.0

### Minor Changes

- 4e2504f: The context map is required, and reads as sentences. `contextMap` in `alveolus.config.ts` lists every bounded context with the contexts it consumes: `{ catalog: { consumes: [] }, ordering: { consumes: ["catalog"] } }`. A context left out, a context that consumes itself or a cycle fails the configuration. `strategic/no-unmapped-context` no longer has a mode without a map, and tells to reverse a dependency before adding it to the map. To migrate, turn `{ ordering: ["catalog"] }` into `{ catalog: { consumes: [] }, ordering: { consumes: ["catalog"] } }`, and add `consumes: []` for each context the old map left out.

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
