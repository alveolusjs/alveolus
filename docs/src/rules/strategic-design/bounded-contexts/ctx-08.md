---
code: CTX-08
title: Pas de préfixe juste pour éviter un conflit avec un autre bounded context
group: Homonymes entre bounded contexts
scope: [domain]
style: [tactical]
severity: minor
detection: LLM
detectionNote: Aidée par le glossaire.
review: approved
sources:
  - "Making Sense of Bounded Contexts, sidebar 'The Context Gives Each Term a Very Specific Meaning'"
---

# CTX-08 · Pas de préfixe juste pour éviter un conflit avec un autre bounded context

<RuleMeta />

## Signal

Un nom avec un préfixe ou un suffixe dont le seul but est d’éviter un conflit avec un autre bounded context (`TreasuryTransfer`, `CheckingAccount` dans le bounded context des comptes courants, `PaymentsCustomer`).

## Pourquoi

Ne pas inventer un nom juste pour distinguer un concept d’un terme d’un autre bounded context. Le bounded context donne le sens. `Transfer` reste `Transfer` dans `treasury` comme dans `payments`, et `Account` reste `Account` dans le bounded context des comptes courants comme ailleurs.

## Exceptions

L’équipe peut tout de même choisir un nom plus riche quand son langage l’emploie.

## Correction

Utiliser le terme du glossaire du bounded context.
