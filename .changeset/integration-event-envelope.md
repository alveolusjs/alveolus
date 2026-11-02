---
"@alveolus/claude-rules": patch
---

The integration event examples use the envelope of `@alveolus/core`: `id` instead of `eventId`, `occurredAt` instead of `occurredOn`, and the `source`, `correlationId` and optional `causationId` fields. A consumer that followed PUB-05 or MSG-04 validated an `eventId` the core never sends. ACL-04 names the date of the fact `occurredAt` too.
