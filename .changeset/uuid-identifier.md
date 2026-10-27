---
"@alveolus/core": minor
---

Add `UuidIdentifier`, whose `parse` reads any RFC 9562 UUID in lowercase, and `InvalidIdentifier`, the refusal it returns. Core still generates nothing: an identity builds a generated value from the app's `IdGenerator`.
