---
"@alveolus/claude-rules": minor
---

Every rule has a kind: a safeguard (a defect can lose or corrupt money, data or a message, open a security hole, or hide such a loss), a structure rule (a defect makes the code diverge from the model, breaks a boundary or creates costly coupling), or a convention (one valid form among several). Each packaged rule carries `kind`, the generated rule files print it under the severity, and the reviewer agent explains it. Severities now follow the kind: every safeguard is blocking, every structure rule major, every convention minor, so 64 rules change severity or note; a note keeps a lower level only for a signal that belongs to another concern.
