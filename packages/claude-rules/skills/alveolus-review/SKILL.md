---
name: alveolus-review
description: Review an implemented design, or any change, against the Alveolus rules, the design and its acceptance criteria. Use when the user asks for a review.
argument-hint: "[design file | git range]"
disable-model-invocation: true
---

# Review a change

1. Find what to review: the design named in `$ARGUMENTS` and the changes since the base branch, or the git range given, or else the uncommitted changes. Include untracked files.
2. Run the app's full checks: lint, type check, tests. A failing check is a `blocking` finding, reported with its output.
3. Give the list of changed files to the `alveolus-reviewer` agent. It reviews them against the rules in its own context, so it judges the code, not the intent behind it.
4. With a design, check yourself:
   - each acceptance criterion has a test that proves it, and the test passes;
   - the code matches the design: files, model, use cases, contracts. A gap is a finding, or a design change to record with the user;
   - each waiver in the code is listed in the design.
5. Report the findings most severe first, one per line, in the reviewer's format, then the verdict: `ready`, or `to fix` with what blocks. Fix nothing unless the user asks.

When the user accepts a `ready` verdict, set the design `status` to `reviewed`.
