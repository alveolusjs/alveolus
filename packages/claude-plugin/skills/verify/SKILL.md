---
name: verify
description: Verify a built slice against the product documentation and the Alveolus rules, then ship it in the documentation. Use when the user asks to verify, review or ship a slice.
argument-hint: "[app] <slice number>"
disable-model-invocation: true
---

# Verify and ship a slice

Read the app's `harness.md` first (see the `spec` skill for how to find it). Every task of the slice's `tasks.md` but the shipping one must be ticked; otherwise stop and list what is left.

1. Run the full checks of `harness.md` and report each failure with its output.
2. Run the `alveolus:reviewer` agent on the changes of the slice: the diff against the commit before the slice, plus untracked files. It checks the rules the tooling cannot.
3. Check the spec: each scenario of "Behaviour" has a test, each rule of "Rules proven" has its test file with `holds` and `resists` blocks.
4. If anything is red, or the reviewer reports a `blocking` or `major` finding, stop and report. Do not ship.
5. Otherwise ship the slice's entries in the product documentation, as `harness.md` says, and change nothing else there. Run the conformance check again: it must pass with the entries shipped. Set the spec `status` to `done`, and its line in the slice plan.
6. Report what shipped, the reviewer's `minor` findings and `question`s, and the open questions of the spec still standing.
