---
name: alveolus-review
description: Review an increment of a design, or any change, against the Alveolus rules, the design and its acceptance criteria, before its pull request. Use when the user asks for a review.
argument-hint: "[design file | git range]"
disable-model-invocation: true
---

# Review a change

1. Find what to review, uncommitted and untracked files included:
   - with a design named in `$ARGUMENTS`: its increment built on the current branch, the changes since the base branch;
   - with a git range: that range;
   - else the uncommitted changes.
2. Run the app's full checks: lint, type check, tests. A failing check is a `blocking` finding, reported with its output.
3. Give the list of changed files to the `alveolus-reviewer` agent. It reviews them against the rules in its own context, so it judges the code, not the intent behind it.
4. With a design, check yourself:
   - the increment's "Done when" passes, and the changed files are the increment's files;
   - its "Safe because" holds: nothing reachable before the wiring increment, a migration that only adds, the old path still working during a parallel change;
   - the code matches the design: model, use cases, contracts. A gap is a finding, or a design change to record with the user;
   - each waiver in the code is listed in the design.
5. On the last increment, check the whole story too: each acceptance criterion has a test that proves it, the test passes, and the code matches the whole design.
6. Report the findings most severe first, one per line, in the reviewer's format, then the verdict: `ready`, or `to fix` with what blocks. Fix nothing unless the user asks.
7. With a `ready` verdict on an increment, propose the pull request title, in the repository's format, and its body: the increment, the criteria it covers, why it is safe to merge, the rules checked.

When the user accepts a `ready` verdict on the last increment, set the design `status` to `reviewed`.
