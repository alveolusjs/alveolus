---
"@alveolus/claude-rules": patch
---

Severities are recalibrated by consequence: blocking for lost or corrupted data, a security hole or a lost message; major for a broken boundary or invariant, or coupling that is expensive to undo; minor for a local deviation. About fifty rules change severity or note, and three cross-references are fixed (CTX-05, WIR-03, WIR-11).

A sixth part, Exploitation, ships with it: OBS-01 to OBS-05 (structured logs, one log per failure, a correlation id kept to the consumer, liveness and readiness, outbox and dead letters measured) and SEC-01 to SEC-04 (inputs validated at the edge, the caller's identity from authentication, secrets kept in configuration, personal data only where it serves).
