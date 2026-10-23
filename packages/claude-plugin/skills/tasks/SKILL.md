---
name: tasks
description: Break a designed slice into ordered, test-first tasks in tasks.md. Use when the user asks for the tasks of a slice.
argument-hint: "[app] <slice number>"
disable-model-invocation: true
---

# Plan the tasks of a slice

Read the app's `harness.md` first (see the `spec` skill for how to find it). The slice's spec must have `status: designed`, with `design.md` next to it; otherwise stop and say so.

Read `spec.md` and `design.md`, then write `<slices>/NNN-<slug>/tasks.md`: a checklist of small tasks, each one commit, each one leaving the fast checks of `harness.md` green.

Order, test first:

1. The business rule tests and the scenarios of the spec, written against the published contract and run: they fail because the behaviour is missing, not because of a typo.
2. Tactical style only. Domain: unit tests, then the model.
3. Application: commands, queries, ports. In the transaction script style, the scripts themselves, with the schema and migration they need.
4. Driven adapters: schema and migration, mappers, repositories with their contract test, outgoing messages. In the transaction script style, only the adapters other than the database.
5. Published contract.
6. Driving adapters: routes, request and response schemas, documented errors.
7. Rule tests and scenarios now pass.
8. Ship the entries in the product documentation, as `harness.md` says, and change nothing else there.

Task format:

```md
- [ ] **T01 · <verb> <what>** — <files>. Done when: <a test or command that proves it>.
```

Then set the spec `status` to `planned`.
