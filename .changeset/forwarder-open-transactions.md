---
"@alveolus/claude-rules": patch
---

MSG-03 asks the forwarder never to read past an event whose transaction is still open. A sequence number is given when the row is written, not when it commits: a forwarder that publishes number 11 and records it would never read number 10 if its transaction commits later. With PostgreSQL, each outbox row keeps the transaction that wrote it, and the forwarder reads only the rows written before the oldest transaction still open.
