---
name: alveolus-implement
description: Implement an approved technical design, test first and layer by layer, following the Alveolus rules. Use when the user asks to implement a design.
argument-hint: "<design file>"
disable-model-invocation: true
---

# Implement a design

Read the design named in `$ARGUMENTS`, or the only design of `docs/designs/` whose `status` is `approved`. If its status is not `approved`, stop: the user approves the design first.

Before writing in a folder, read its rules file: `.claude/rules/alveolus/index.md` gives it. A new file only loads its rules after it is written.

Work through the Files table of the design, inside out: domain, application, driven, driving, then wiring. For each acceptance criterion:

1. Write the test the design names for it. Run it and see it fail for the expected reason.
2. Write the code that makes it pass, following the design and the rules.
3. Run the app's checks on the touched area: lint, type check, tests, as its `package.json` scripts or CLAUDE.md give them.

Stop and report instead of improvising when:

- the work needs behaviour that neither the story nor the design states;
- the design does not hold in the code: propose the change to the design, and go on once the user accepts it;
- a rule cannot be kept: propose a waiver with its reason, never deviate silently;
- the work would change a big ball of mud beyond what the design names, or model it: it stays contained (MAP-04).

When every criterion has its passing test and the checks pass, set the design `status` to `implemented`, list the files changed, and suggest `/alveolus-review`. Commit only if the user asks.
