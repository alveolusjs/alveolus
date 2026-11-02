---
code: AGG-09
title: Les domain events portent des identités, pas des aggregates
group: Transactions et cohérence
scope: [domain, public]
style: [tactical]
kind: structure
severity: major
detection: []
review: approved
sources:
  - "Scalability and Distribution"
  - "Implementing Eventual Consistency"
---

# AGG-09 · Les domain events portent des identités, pas des aggregates

<RuleMeta />

## Signal

Une propriété de domain event typée par un aggregate, une entity ou un objet de persistance.

## Pourquoi

Les domain events portent les identités des aggregates concernés. Les event handlers du bounded context s’en servent pour agir sur d’autres aggregates, et le translator les recopie dans les integration events que lisent les autres bounded contexts. Embarquer l’objet entier lie ces lecteurs à la structure interne de l’aggregate.

## Exceptions

Les valeurs dont l’event handler a besoin (un montant, un compteur, un statut) voyagent à côté des identités.

## Correction

Des identités typées, avec des valeurs primitives ou des value objects sérialisables.
