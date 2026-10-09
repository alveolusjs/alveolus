---
"@alveolus/arch": minor
---

In the wiring, a module of another context is read by its properties only. `strategic/no-cross-context-import` reports a composition root or a file at the root of `src/` that reaches into such a module with brackets, `Reflect.get`, a spread, destructuring, or by passing it to a function that could hand back anything, such as a helper or lodash `get`. `Reflect.get(Reflect.get(this.catalog, "commands"), "changePrice")` gave a handler of the catalog to ordering with a type the analysis could not follow. A module handed whole to the constructor of another module stays allowed.
