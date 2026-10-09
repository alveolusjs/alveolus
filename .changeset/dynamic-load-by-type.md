---
"@alveolus/arch": minor
---

Code loaded at runtime is recognised by its type, not only by its name: an alias of `Function` or `eval`, the `constructor` of a function (`(() => 0).constructor`, the `AsyncFunction` constructor), `Reflect.construct(Function, …)`, and a lookup on `globalThis`, `global`, `window` or `self` whose key is computed, such as `Reflect.get(globalThis, name)`. The documentation said `new Function` and `eval` were reported; written without their names, they were not. The message of `strategic/no-unmapped-context` now says how to reverse a dependency, with an integration event and not with a callback, and the page of `strategic/no-shared-state` no longer claims that an instance field is never shared.
