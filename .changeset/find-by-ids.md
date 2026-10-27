---
"@alveolus/core": minor
---

`CommandRepository` gains `findByIds`, which returns the aggregates it found and the identities it did not (`{ found, missing }`). By default it calls `findById` for each identity; an adapter replaces it with one query.
