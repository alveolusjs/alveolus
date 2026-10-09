# @alveolus/arch

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
