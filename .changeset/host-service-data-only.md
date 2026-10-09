---
"@alveolus/arch": minor
---

`strategic/no-leaky-host-service` reports an open host service that receives a function, at any depth of its parameters (a callback, an options object with a handler, an array of listeners), or returns `unknown`, `any` or `object`. An `onRestockNeeded(callback)` on the catalog's open host service let it run code of another context while the context map said it consumed nothing, and a result typed `unknown` let a live aggregate leave the context. To let another context react, publish an integration event. A parameter may still be `unknown`, for a payload to validate.
