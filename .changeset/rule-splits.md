---
"@alveolus/claude-rules": patch
"@alveolus/lint-config": patch
---

Five rules are narrowed so that each one holds a single concern. TXS-02 keeps one transaction per script, and the ban on calling another script moves to TXS-09. SEC-02 keeps the caller's identity from authentication, and the caller carried by the command moves to UC-13. PLC-07 keeps a technology imported only in its folder, and the split of adapters by technology moves to PLC-13. PER-06 keeps bounded lists, and reading by pages without skipping a row moves to PER-13. TXS-06 hands raw SQL to SEC-05. The new rules ship once they are approved. The ESLint message of PLC-07 follows its new title.
