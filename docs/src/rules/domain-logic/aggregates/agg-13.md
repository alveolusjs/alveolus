---
code: AGG-13
title: Ne pas découper un vrai invariant
group: Frontière et taille
scope: [domain]
style: [tactical]
severity: major
detection: []
review: approved
sources:
  - "Rule: Design Small Aggregates"
  - "Rethinking the Design, Again"
  - "Time for Decisions"
---

# AGG-13 · Ne pas découper un vrai invariant

<RuleMeta />

## Signal

- Deux données qui doivent rester cohérentes se retrouvent dans deux aggregates.
- Un découpage retire un état dérivé des parties (un statut calculé à partir des lignes), sans event de synchronisation ni délai validé par le métier.

## Pourquoi

Petit ne veut pas dire minimal. La bonne taille, c’est l’aggregate root et ce qui doit rester cohérent avec lui, rien de plus. Garder les parties dans leur aggregate tant que leur regroupement n’a pas de coût avéré.

## Exceptions

Un découpage justifié par AGG-12, avec une eventual consistency acceptée par le métier (AGG-10).

## Correction

Garder l’invariant dans un seul aggregate. Ne découper que pour un coût mesuré ou estimé.
