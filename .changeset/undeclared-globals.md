---
"@alveolus/arch": minor
---

`strategic/no-cross-context-import` reports a name of `globalThis`, `global`, `window` or `self` that no file declares, written or read: an assignment, `Reflect.set`, `Reflect.get`, `Object.assign`, `Object.defineProperty` or `(globalThis as any).x`. `Reflect.set(globalThis, "catalog:prices", handler)` in one context and `Reflect.get` in another let them call each other with no import. A name the library declares, such as a polyfill of `globalThis.crypto`, stays allowed.
