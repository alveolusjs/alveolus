---
name: alveolus-implement
description: Implement the next increment of an approved technical design, test first, on its own branch, following the Alveolus rules. Use when the user asks to implement a design or its next increment.
argument-hint: "<design file> [increment]"
disable-model-invocation: true
---

# Implement an increment

Read the design named in `$ARGUMENTS`, or the only design of `docs/designs/` whose `status` is `approved` or `in-progress`. You build **one** increment of its `## Increments`: the one named in `$ARGUMENTS`, or else the first unticked one. The next increment waits for this one to be merged.

## Check before you start

Stop and say why when:

- the design's `status`, on the base branch, is neither `approved` nor `in-progress`: the user approves the design first, and merges it;
- an increment before this one is not ticked on the base branch: each increment is ticked in its own pull request, so it is not merged yet;
- the working tree has uncommitted changes.

Update the base branch, then create a branch from it, named as the app's CLAUDE.md says, or else `feat/<slug>-i<n>`.

## Build

Before writing in a folder, read its rules file: `.claude/rules/alveolus/index.md` gives it. A new file only loads its rules after it is written.

1. Write the test that the increment's "Done when" names. Run it and see it fail for the expected reason.
2. Write the code that makes it pass, following the design and the rules, inside the increment's files only.
3. Run the app's checks on the touched area: lint, type check, tests, as its `package.json` scripts or CLAUDE.md give them.

Keep what the increment's "Safe because" promises: nothing reachable before the wiring increment, a migration that only adds, the old path still working during a parallel change.

Stop and report instead of improvising when:

- the work needs behaviour that neither the story nor the design states;
- the design does not hold in the code: propose the change to the design, and go on once the user accepts it;
- the increment needs files outside its list, or grows well beyond its budget: propose to cut it again, and update `## Increments` with the user, on this branch;
- a rule cannot be kept: propose a waiver with its reason, never deviate silently;
- the work would change a big ball of mud beyond what the design names, or model it: it stays contained (MAP-04).

## Finish

1. Run the app's full checks. They all pass, or the increment is not done.
2. Tick the increment in the design. Set the `status` to `in-progress` on the first increment, `implemented` on the last.
3. Commit, in the repository's format. Never push: the user opens the pull request.
4. List the files changed and suggest `/alveolus-review`.
