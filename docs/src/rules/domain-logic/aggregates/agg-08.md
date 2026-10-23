---
code: AGG-08
title: Hors de la frontière, eventual consistency avec un handler strict
group: Transactions et cohérence
scope: [driving, driven]
style: [tactical]
severity: major
review: approved
sources:
  - "Rule: Use Eventual Consistency Outside the Boundary"
  - "Implementing Eventual Consistency"
---

# AGG-08 · Hors de la frontière, eventual consistency avec un handler strict

<RuleMeta />

## Signal

- Un handler de domain event modifie plus d’un aggregate.
- Un handler modifie un autre aggregate dans la transaction de la command d’origine.
- Un handler attrape l’erreur et se contente de l’écrire dans les logs, sans retry et sans la propager.
- Rien n’est prévu quand les retries sont épuisés.

## Pourquoi

Chaque subscriber charge un seul aggregate et agit dessus dans sa propre transaction. En cas d’échec, le message n’est pas acquitté : il est livré de nouveau et rejoué, jusqu’à une limite. Au-delà, il faut compenser, ou au moins signaler l’échec pour que quelqu’un intervienne. Un handler qui avale l’erreur en silence laisse le système incohérent.

## Exceptions

Aucune.

## Correction

- Un handler, une transaction, un aggregate.
- L’erreur se propage pour déclencher le retry.
- Une limite de retries, puis une dead letter ou une alerte.

## Adaptation

L’aggregate ne publie pas ses events lui-même par un singleton statique. Il les enregistre, et ils partent par l’outbox après le commit.

**Notre choix** : pas de broker par défaut. Un forwarder interne livre les events de l’outbox aux handlers de l’application, chacun dans sa propre transaction. Un broker peut se brancher plus tard derrière le même port, sans changer le domaine (MSG-01, MSG-03).

## Voir aussi

EVT-07 interdit à un subscriber synchrone de modifier un autre aggregate. MSG-01 enregistre l’état et les events ensemble, par l’outbox, et MSG-04 rend le consumer idempotent.
