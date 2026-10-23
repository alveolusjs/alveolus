---
name: alveolus-design
description: Turn a user story into a technical design that follows the Alveolus rules, for the user to approve before any code is written. Use when the user gives a user story to design.
argument-hint: "<user story: text, file or issue>"
disable-model-invocation: true
---

# Design a user story

You decide **how** the story is built, inside the Alveolus rules. You write no production code: the user approves the design first. The design names the rules it applies, and any deviation is a waiver the user accepts.

## Read

1. The user story in `$ARGUMENTS`: inline text, a file, or an issue (`gh issue view`).
2. `architecture.json`: the bounded contexts and their style, `tactical` or `transaction-script`, and the big balls of mud (`big-ball-of-mud`).
3. `.claude/rules/alveolus/index.md`: which rules file covers which folder.
4. The code the story extends: its bounded context, aggregates, use cases, adapters, schema and tests. Reuse what exists rather than adding a parallel version.
5. The rules file of every folder the design touches, before deciding anything in it.

## Check the story

- Each acceptance criterion can be stated as a scenario without inventing behaviour.
- What the story leaves open and the design must decide goes under "Open questions", with the assumption the design makes. Never settle business behaviour silently.
- The story belongs to one bounded context. If it spans several, say how they integrate (through `public`, a facade or events), or propose to split the story.
- The story touches a big ball of mud: design either a fix or a small change inside it, in the style of the code around it, or a bounded context of its own that reads it only through an anticorruption layer in `driven` (MAP-04). Never a model inside it: no aggregates, no value objects, no layers. When the story deserves its own model, say so and propose the new bounded context.

## Write

Write `docs/designs/<slug>.md`, or the folder the app's CLAUDE.md names, with the template below, in the language of the story, short sentences. Report the open questions and the waivers, and ask the user to review. The `status` stays `draft` until the user approves; it then becomes `approved`, and only then can `/alveolus-implement` start.

## Template

```md
---
story: <title>
status: draft
context: <bounded context>
style: <tactical | transaction-script>
---

# <title>

## User story

The story as given, and where it comes from.

## Acceptance criteria

1. Given …, when …, then …

## Model

Tactical style: aggregates (identity, invariants they guard, the methods that guard them), entities, value objects, domain events, errors, ports. Transaction script style: the scripts, one per use case, with the checks each one makes.

## Use cases

Commands and queries: input, what they load, what they call, the `Result` they return and its errors, the transaction.

## Adapters

Driving (controllers, consumers, facade) and driven (repositories, view adapters, clients), with the contract each one exposes or uses.

## Persistence

Schema changes and their migration.

## Files

| Layer | File | New or changed | What it holds |
| --- | --- | --- | --- |

## Tests

| Criterion | Test | Level |
| --- | --- | --- |

## Rules applied

| Rule | Where | How |
| --- | --- | --- |

Waivers, if any: the rule, the reason, and what keeps the risk low.

## Open questions

Each question, and the assumption the design makes until it is answered.
```
