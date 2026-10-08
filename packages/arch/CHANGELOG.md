# @alveolus/arch

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
