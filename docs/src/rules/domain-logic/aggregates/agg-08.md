---
code: AGG-08
title: Hors de la frontière, eventual consistency avec un event handler strict
group: Transactions et cohérence
scope: [driving, driven]
style: [tactical]
kind: safeguard
requires: [messaging.outbox-forwarder]
severity: blocking
severityNote: Bloquante si un event handler avale l’erreur, ou si rien n’est prévu quand les retries sont épuisés. Majeure pour un event handler qui modifie plus d’un aggregate.
detection: []
review: approved
sources:
  - "Rule: Use Eventual Consistency Outside the Boundary"
  - "Implementing Eventual Consistency"
---

# AGG-08 · Hors de la frontière, eventual consistency avec un event handler strict

<RuleMeta />

## Signal

- Un event handler modifie plus d’un aggregate.
- Un event handler synchrone modifie un autre aggregate.
- Un event handler attrape l’erreur et se contente de l’écrire dans les logs, sans retry et sans la propager.
- Rien n’est prévu quand les retries sont épuisés.

## Pourquoi

Chaque event handler asynchrone charge un seul aggregate et agit dessus dans sa propre transaction. En cas d’échec, le message n’est pas acquitté : il est livré de nouveau et rejoué, jusqu’à une limite. Au-delà, il faut compenser, ou au moins signaler l’échec pour que quelqu’un intervienne. Un event handler qui avale l’erreur en silence laisse le système incohérent.

## Exceptions

Aucune.

## Correction

- Un event handler, une transaction, un aggregate.
- L’erreur se propage pour déclencher le retry.
- Une limite de retries, puis une dead letter ou une alerte.

## Adaptation

L’aggregate ne publie pas ses events lui-même par un singleton statique. Il les enregistre, et le use case les transmet au dispatcher après `save` (EVT-03).

**Notre choix** : l’event handler qui modifie un autre aggregate est déclaré asynchrone. Le dispatcher enregistre le domain event dans l’outbox, et le forwarder le livre après le commit, dans une transaction par event handler. L’event handler lit le domain event de son bounded context, jamais le published language de son propre bounded context. Un broker peut se brancher plus tard derrière le même port, sans changer le domaine (MSG-01, MSG-03).

## Voir aussi

EVT-07 interdit à un event handler synchrone de modifier un autre aggregate. MSG-01 enregistre l’état et les events ensemble, par l’outbox, et MSG-04 rend le consumer idempotent.
