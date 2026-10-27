---
"@alveolus/claude-rules": patch
---

REP-03 gives each outcome one channel, for every port: a refusal is a `Result`, an absence `undefined`, a failure an exception. `save` returns a `Result` even with `never`, and a batch finder says which identities it did not find.
