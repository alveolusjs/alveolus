---
name: build
description: Implement the next task of a planned slice, test first, following the app's conventions and the Alveolus rules. Use when the user asks to build or continue a slice.
argument-hint: "[app] <slice number> [task id]"
disable-model-invocation: true
---

# Build a slice

Read the app's `harness.md` first (see the `spec` skill for how to find it), then the slice's `spec.md`, `design.md` and `tasks.md`. Set the spec `status` to `building` when the first task starts.

For each task, the given one or else the next unchecked one, until the user stops you or the list is done:

1. Write or extend the test that proves the task. Run it and see it fail for the expected reason.
2. Write the code, following the conventions file and the rules listed in `design.md`.
3. Run the fast checks of `harness.md` and the tests of the touched area.
4. Tick the task in `tasks.md` and propose a commit message in the repository's format. Commit only if the user asked for commits.

Stop and report instead of improvising when:

- the task needs behaviour the spec does not state: the gap goes back to the product documentation first (doc-first), then to the spec;
- the design does not hold: update `design.md` with the user before going on;
- an Alveolus rule cannot be kept: propose a waiver and its decision record, never write one silently.

Never ship an entry in the product documentation before the last task: the `verify` skill does it.
