---
name: alveolus-design
description: Turn a user story, a task or an epic into a technical design that follows the Alveolus rules, written by specialised agents from a fixed template and checked by a tool, cut into small increments that each merge on their own, for the user to approve before any code is written. Use when the user gives a ticket to design, or answers the questions of a design.
argument-hint: "<story, task or epic: text, file or issue> | <design to revise> | <epic design> S-n"
disable-model-invocation: true
context: fork
agent: alveolus-designer
background: false
---

Design this ticket: $ARGUMENTS

Lead the design as your instructions say: triage the ticket, run the design agents in order, assemble their notes, check the design and have it reviewed, then report. Write no production code.

When no ticket is given, reply that `/alveolus-design` needs one: a text, a file, an issue, a design to revise, or an epic design followed by one of its stories (`S-1`).
