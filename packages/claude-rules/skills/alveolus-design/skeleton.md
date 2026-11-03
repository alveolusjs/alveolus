---
title: <title of the story or task>
type: story
source: <link to the issue or ticket>
status: draft
version: 1
contexts:
  - name: <context>
    style: tactical
    subdomain: core
    new: false
rules: "@alveolus/claude-rules <version>"
---

<!--
FILLING RULES. This comment stays in the document: it does not render. The full rules are in the template of /alveolus-design.

- The language of the story, headings included. Section numbers (1 to 15, A to C) never change.
- AC-n acceptance criterion, D-n decision, Q-n question, INV-n invariant, T-n test, In increment, ADR-n, W-n waiver; AGG:, VO:, ERR:, EVT:, UC:, QRY:, API:, TBL: for the model. An element is defined once, and cited elsewhere by its identifier.
- Checked by `alveolus-claude design check <file>`.
-->

# <Title of the story>

> **How to read this document.** The business reads parts 1 and 2. The tech team reads everything. Identifiers (`AC-n`, `D-n`, `Q-n`, `INV-n`, `UC:...`) point to their definition in the document. The Alveolus rules applied are gathered in appendix B.

## Summary

<!-- slot: summary -->

<!-- slot: map -->

<!-- slot: facts -->

---

# Part 1. The need

## 1. Story

<!-- slot: 1.story -->

<!-- slot: 1.existing -->

## 2. Acceptance criteria

<!-- slot: 2 -->

## 3. Out of scope

<!-- slot: 3 -->

---

# Part 2. To validate

## 4. Design decisions

| ID | Decision | Why | Rejected alternative | ADR |
| --- | --- | --- | --- | --- |
<!-- slot: decisions -->

## 5. Open questions

### For the business

| ID | Question | Assumption meanwhile | Blocks |
| --- | --- | --- | --- |
<!-- slot: questions.business -->

### For the tech team

| ID | Question | Assumption meanwhile | Blocks |
| --- | --- | --- | --- |
<!-- slot: questions.tech -->

### On the rules

| ID | Question | Assumption meanwhile | Blocks |
| --- | --- | --- | --- |
<!-- slot: questions.rules -->

---

# Part 3. Design

## 6. Contexts and language

<!-- slot: 6 -->

## 7. Model

<!-- slot: 7 -->

## 8. Processes and events

<!-- slot: 8.process -->

### Domain events

<!-- slot: 8.events -->

### Messages between contexts

<!-- slot: 8.messages -->

## 9. Use cases

<!-- slot: 9 -->

## 10. Contracts

### HTTP routes

<!-- slot: 10.routes -->

### Facades

<!-- slot: 10.facades -->

## 11. Data

<!-- slot: 11 -->

## 12. External integrations

<!-- slot: 12 -->

## 13. Operations

<!-- slot: 13 -->

---

# Part 4. Delivery

## 14. Increments

<!-- slot: 14 -->

## 15. Tests

<!-- slot: 15 -->

---

# Appendices

## A. Files

<!-- slot: A -->

## B. Alveolus rules applied

| Rule | Where | How |
| --- | --- | --- |
<!-- slot: rules -->

### Waivers

| ID | Rule | Reason | What limits the risk | ADR |
| --- | --- | --- | --- | --- |
<!-- slot: waivers -->

## C. ADRs to write

| ID | Decision | Rules | Depends on |
| --- | --- | --- | --- |
<!-- slot: adrs -->
