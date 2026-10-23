---
name: design
description: Design an approved slice against the Alveolus rules. Reads spec.md, the reference architecture and the applicable rules, and writes design.md next to it. Use when the user asks to design a slice.
argument-hint: "[app] <slice number>"
disable-model-invocation: true
---

# Design a slice

You decide **how** the slice is built, inside the Alveolus rules. The rules are the constitution: the design names the rules it applies, and any deviation is a waiver.

Read the app's `harness.md` first (see the `spec` skill for how to find it). The slice's `spec.md` must have `status: approved`; otherwise stop and say so.

## Steps

1. Read the spec, the conventions file and the reference architecture that `harness.md` names, then the pages it links to: default choices, what goes where and the file roles of each layer (PLC, PLC-03), naming (NAM), wiring (WIR).
2. Read the code the slice extends in the app: reuse its aggregates, value objects, ports and contracts rather than adding parallel ones. Read the shared building blocks `harness.md` lists.
3. Find the style of the context the slice touches in the styles file of `harness.md`: `tactical` or `transaction-script`. A context declared `big-ball-of-mud` is contained, not modelled (MAP-04): the slice fixes it at the minimum, or builds a bounded context of its own that reads it through an anticorruption layer. List the scopes the slice touches (`domain`, `application`, `driving`, `driven`, `public`, `schema`, `tests`, `structure`; a transaction script context has no `domain`) and read the rules whose frontmatter `style` lists that style and whose `scope` contains one of them. Skip the conditional rules that the app's decisions make inactive, and the rules whose `review` is `rejected`.
4. Check the design satisfies the app's conformance check: each convention it requires, as `harness.md` describes them, is designed in.
5. Write `<slices>/NNN-<slug>/design.md` with the template below.
6. Set the spec `status` to `designed` once the user approves the design.

## Template

```md
# NNN · <title> · Design

## Model

Tactical style: aggregates (identity, invariants they guard, business rules), value objects, domain services, factories. Transaction script style: the scripts, one per use case, with the checks each one makes. One line each, with the file it lives in.

## Events

Domain events, and the integration events they become in the published contract.

## Application

Commands and queries, one handler each, with their file names; the ports they need.

## Persistence

Models, migration, mappers, repositories, read views.

## Published contract

What callers see: methods, request and answer types, the error union of each method, routes with their scope, success status and documented errors.

## Rules applied

| Rule | Where | How |
| --- | --- | --- |

Waivers, if any, in the form the conventions file sets, with their decision record.

## Risks

What could make the slice harder than planned, and what we do about it.
```
