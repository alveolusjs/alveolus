---
name: spec
description: Start a slice of an app built with the harness. Reads the app's product documentation for the entries of the slice and writes the slice's spec.md. Use when the user asks to spec a slice.
argument-hint: "[app] <slice number, entry names or documentation page>"
disable-model-invocation: true
---

# Spec a slice

You write the **spec** of one slice: what it must do, as the product documentation already says it. The documentation is the source of truth. The spec selects, links and turns it into acceptance scenarios. It never invents behavior.

## Find the app

Each app built with the harness has a `harness.md` at its root, which says where its product documentation, catalog, slices, rules and checks are. Read it first. If `$ARGUMENTS` does not name the app and the repository has several `harness.md` (outside `node_modules`), ask which one.

Everything below refers to what `harness.md` declares: the **catalog** (the documented entries and their status), the **reading guide** (what to read for an entry), the **slices folder** and its plan, the **doc-first** signals.

## Steps

1. Find the slice: its number in the slice plan if the argument names one, else the next free `NNN` in the slices folder. Pick a short kebab-case slug.
2. Load the catalog entries of the slice. Only entries whose status is still the "not shipped" one can enter a slice.
3. For each entry, read what the reading guide lists: its own section, the rules it cites, the errors and events it names, the how-to pages that use it, the shared conventions, the open decisions.
4. Check the documentation is enough, **doc-first**:
   - a page the slice relies on is marked wrong: stop and report it;
   - the slice depends on a point still to confirm or an open decision: list it under "Open questions", with the assumption the slice will make;
   - the documentation is silent or contradicts itself on something the slice must decide: propose the change to the documentation, in its own language and conventions, and list it as a blocking question. Never settle it in the spec only.
5. Write `<slices>/NNN-<slug>/spec.md` with the template below, in the repository's language, short sentences.
6. Add or update the slice line in the slice plan.
7. Report the open questions and ask the user to review. The spec stays `draft` until the user approves it; its `status` then becomes `approved`.

## Template

```md
---
slice: NNN
title: <what the slice delivers>
status: draft
entries: [<entry names>]
rules: [<business rule codes>]
events: [<event names>]
---

# NNN · <title>

## Goal

Two or three sentences: what a caller can do once the slice ships, and why now.

## Scope

| Entry | Kind | Documentation |
| --- | --- | --- |

## Behaviour

One subsection per entry. Each scenario is Given / When / Then and cites its source: a rule code or a documentation anchor. Cover the success, each documented refusal, each invalid case specific to the entry, the replay, and the observable effects.

## Rules proven

One line per business rule: the test file, at the lowest level that holds the rule (COV-02), what its `holds` block checks, and the ways to break it that its `resists` block checks, only those that apply.

## Out of scope

What the documentation says about these entries that this slice leaves for later, and which slice takes it.

## Open questions

The points to confirm and open decisions the slice depends on, each with the assumption made, and the documentation changes proposed.
```

Do not paraphrase the documentation at length: link it, and state only what a test will check.
