---
code: TXS-06
title: Un script accède à la base à travers la transaction du Unit of Work
group: Organisation et accès aux données
scope: [application]
style: [transaction-script]
severity: blocking
review: approved
sources: []
---

# TXS-06 · Un script accède à la base à travers la transaction du Unit of Work

<RuleMeta />

## Signal

- Un script qui injecte `PrismaClient` et l’appelle directement : ses écritures s’exécutent hors de la transaction.
- Un script qui ouvre son propre `prisma.$transaction(...)`.
- Du SQL brut construit par concaténation de chaînes, dans un script.

## Pourquoi

Prisma dans le script, c’est ce qui rend ce style bon marché : ni repository, ni mapper. Mais seul le client de la transaction en cours garde ensemble les écritures du use case. Le client global écrit immédiatement, et un refus plus tard ne l’annule plus.

## Exceptions

Une méthode de lecture hors de toute transaction peut lire avec le client par défaut, que le Unit of Work renvoie aussi.

## Correction

Injecter le Unit of Work Prisma (`PrismaUnitOfWork`) et utiliser son client : `this.#unitOfWork.client()`. Pour ce que Prisma ne sait pas exprimer, écrire le SQL dans un tagged template, avec `$queryRaw`.

## Adaptation

**Notre choix** : le Unit of Work Prisma de `shared/driven/prisma` est le même dans les deux styles. Son `client()` renvoie le client de la transaction ouverte par `run`, ou le client par défaut en dehors.

## Voir aussi

REP-13 et REP-14 posent la même règle de transaction pour les repositories, en style tactique.

## Exemple

```ts
// Avoid: the global client writes outside the transaction
await this.prisma.fee.update({ where: { id }, data: { status: FeeStatus.WAIVED } });

// Preferred: the client of the current transaction
await this.#unitOfWork.client().fee.update({ where: { id }, data: { status: FeeStatus.WAIVED } });
```
