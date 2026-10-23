---
code: REP-13
title: Le use case décide de la transaction
group: Transactions
scope: [application, driven]
style: [tactical]
severity: major
review: approved
sources:
  - "Managing Transactions (and chapter note 5)"
---

# REP-13 · Le use case décide de la transaction

<RuleMeta />

## Signal

- Un repository qui ouvre sa propre transaction dans `save` et en fait le commit (`dataSource.transaction(...)` ou `prisma.$transaction(...)` dans la méthode).
- Un aggregate, une entity ou un domain service qui gère une transaction.
- Un use case sans transaction, alors qu’il écrit plusieurs choses qui doivent rester ensemble, comme l’aggregate et son outbox.

## Pourquoi

Le domaine n’est jamais le bon endroit pour gérer les transactions. Ses opérations sont trop fines, et n’ont pas à savoir qu’une transaction existe.

Les gérer dans la couche application : chaque use case ouvre la transaction, utilise le modèle, puis fait le commit, ou annule tout en cas d’échec. Déclaratif ou explicite, le principe est le même.

## Exceptions

Certains stockages n’ont pas de transactions ACID (beaucoup de bases NoSQL). Cette règle ne s’applique pas à eux.

## Correction

Un Unit of Work, ou un decorator transactionnel sur le use case. Les repositories n’ouvrent aucune transaction.

## Adaptation

**Notre choix** : un port `UnitOfWork` déclaré dans `application`, dont la méthode `run(work)` ouvre la transaction. Son implémentation dans `driven` ouvre une transaction interactive Prisma et la range dans un `AsyncLocalStorage` (REP-14).

## Voir aussi

SRV-05 interdit la transaction dans un domain service. UC-04 compte la transaction parmi les rôles légitimes du use case. MSG-01 enregistre l’état et les events dans la même transaction.
