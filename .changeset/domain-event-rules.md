---
"@alveolus/claude-rules": patch
---

The examples declare domain events as classes of `@alveolus/core`, record them with `record(new …)`, and translate them before adding them to the outbox. MSG-01 says the outbox keeps integration events only.
