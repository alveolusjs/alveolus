---
name: alveolus-design
description: Turn a user story or a task into a technical design that follows the Alveolus rules, written from a fixed template and checked by a tool, cut into small increments that each merge on their own, for the user to approve before any code is written. Use when the user gives a user story or a task to design, or answers the questions of a design.
argument-hint: "<user story or task: text, file or issue> | <design file to revise>"
disable-model-invocation: true
---

# Design a user story

You decide **how** the story is built, inside the Alveolus rules, and in which increments. You write no production code: the user approves the design first. The design names the rules it applies, and any deviation is a waiver the user accepts.

The design follows the template `.claude/skills/alveolus-design/template.md`. The filling rules at its top are part of these instructions: read them before writing.

## Read

1. The input in `$ARGUMENTS`: inline text, a file, or an issue (`gh issue view`). A design of `docs/designs/` means a revision: see "Revise".
2. `architecture.json`: the bounded contexts and their style, `tactical` or `transaction-script`, and the big balls of mud (`big-ball-of-mud`).
3. `.claude/rules/alveolus/index.md`: which rules file covers which folder, and the version installed, for the `rules` field of the design.
4. The code the story extends: its bounded context, aggregates, use cases, adapters, schema and tests. Reuse what exists rather than adding a parallel version. Section 1 says what already exists.
5. The rules file of every folder the design touches, before deciding anything in it.

## Check the story

- A story has a role, an action and a benefit. A task is a technical change with no role: its design has `type: task`, and section 1 says why it is needed. Most sections of a task say "None.".
- An epic is too large for one design: propose the stories it splits into, and stop.
- Each acceptance criterion can be stated as a scenario without inventing behaviour.
- What the story leaves open goes to section 5, with the assumption the design makes and what it blocks. Never settle business behaviour silently.
- Each bounded context touched is listed in `contexts`. When there are several, section 6.2 says how they integrate (through `public`, a facade or events), and section 8 shows the transactions. Or propose to split the story.
- The story touches a big ball of mud: design either a fix or a small change inside it, in the style of the code around it, or a bounded context of its own that reads it only through an anticorruption layer in `driven` (MAP-04). Never a model inside it: no aggregates, no value objects, no layers. When the story deserves its own model, say so and propose the new bounded context.
- `subdomain` comes from the app's documentation. When it says nothing, propose one in a decision of section 4.

## Slice

Cut the story into increments, in section 14. Each increment is one pull request that a person reviews in one sitting: it merges on its own, leaves every check of the app green, and breaks no existing behaviour.

- The first criterion is built inside out, one layer per increment: `domain`, `application`, `driven` with its schema and migration, then `driving` with the wiring. Until the wiring, the new code is not reachable, so it changes nothing. In the transaction script style there is no `domain`: the script comes first, with its schema.
- Each other criterion is one increment, end to end.
- A change to existing behaviour is a parallel change, one increment per step: add the new path beside the old one, move the callers, then remove the old one.
- A migration only adds. A drop or a rename comes in a later increment, once no code uses what it removes.
- An increment holds about 300 changed lines of production code, its tests on top, and touches as few rules files as it can. Two small layers may share one increment. A bigger increment is split.
- Each increment says why it is safe to merge in its "Safe because" column. When an increment cannot be safe, say so in section 5: never plan one that breaks.
- A fix inside a big ball of mud is usually one increment.
- Every increment starts with the state `todo`. Its files are in appendix A, its tests in section 15.

## Write

1. Copy the template to `docs/designs/<slug>.md`, or the folder the app's CLAUDE.md names.
2. Fill it section by section, in the language of the story, headings included. Keep the section numbers and the identifiers as they are: tools find them. Write the summary last.
3. Remove each help comment once its section is filled. Keep the filling rules at the top.
4. Run `npx alveolus-claude design check <design>`, or the same through the app's package manager, and fix every problem it reports. Run it again until it passes. When it notes that the Mermaid diagrams are not checked, read each diagram again against the Mermaid syntax.
5. Report the summary, the decisions to validate, the open questions by audience and the waivers, and ask the user to review. The `status` stays `draft` until the user approves; it then becomes `approved`, and only while the check passes.

The approved design is merged on its own, before any code: `/alveolus-implement` reads it from the base branch. Commit it only if the user asks.

## Revise

When `$ARGUMENTS` names a design, or the user answers its questions:

1. Change only the sections the answers touch, and what follows from them: a decision changes the model, which changes the use cases, the data, the tests and the increments.
2. An answered question leaves section 5: it becomes a decision, a criterion or an out-of-scope line.
3. Add 1 to `version`. A design that changes after its approval goes back to `draft`.
4. Run the check again, and report what changed.
