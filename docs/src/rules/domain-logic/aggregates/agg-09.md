---
code: AGG-09
title: Les domain events portent des identités, pas des aggregates
group: Transactions et cohérence
scope: [domain, public]
style: [tactical]
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

Les events portent les identités des aggregates concernés. Les subscribers, y compris ceux d’autres bounded contexts, s’en servent pour agir sur leurs propres modèles. Embarquer l’objet entier lie les consumers à la structure interne du producer.

## Exceptions

Les valeurs dont le subscriber a besoin (un montant, un compteur, un statut) voyagent à côté des identités.

## Correction

Des identités typées, avec des valeurs primitives ou des value objects sérialisables.
