---
title: <title of the epic>
type: epic
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
FILLING RULES. This comment stays in the document: it does not render. The full rules are in the epic template of /alveolus-design.

- The language of the epic, headings included. Section numbers (1 to 9, B, C) never change.
- S-n story, D-n decision, Q-n question, ADR-n, W-n waiver; AGG:, EVT: for the model. An element is defined once, and cited elsewhere by its identifier.
- Checked by `alveolus-claude design check <file>`.
-->

# <Title of the epic>

> **How to read this document.** The business reads parts 1 and 2. The tech team reads everything. Each story of section 2 is then designed on its own. The Alveolus rules applied are gathered in appendix B.

## Summary

<!-- slot: summary -->

<!-- slot: map -->

<!-- slot: facts -->

---

# Part 1. The need

## 1. Epic

<!-- slot: 1.story -->

<!-- slot: 1.existing -->

## 2. Stories

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

## 7. Model sketch

<!-- slot: 7 -->

## 8. Processes and events

<!-- slot: 8.process -->

### Domain events

<!-- slot: 8.events -->

### Messages between contexts

<!-- slot: 8.messages -->

---

# Part 4. Delivery

## 9. Delivery order

<!-- slot: 9 -->

---

# Appendices

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
