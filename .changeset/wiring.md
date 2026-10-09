---
"@alveolus/arch": minor
---

The wiring counts as a dependency. In the composition roots and the files at the root of `src/`, a value of one context given to another (an argument, a property, the body of an arrow function, an assignment, a typed variable) is read through the type checker: `strategic/no-unmapped-context` reports it when the context map does not allow the receiving context to consume the giving one, and `strategic/no-cross-context-import` when it is not an open host service. `new LedgerModule({ redemptions: () => this.emoney.commands.requestRedemption })` in `app.module.ts` tied two contexts with no import between them. `ImportScope` gains `readsWiring(path)`.
