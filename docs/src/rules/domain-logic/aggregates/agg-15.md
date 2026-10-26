---
code: AGG-15
title: Chaque aggregate est protégé par l’optimistic concurrency
group: Concurrence
scope: [driven, schema]
style: [tactical]
severity: blocking
severityNote: Bloquante si deux écritures concurrentes peuvent casser un invariant. Majeure sinon.
detection: []
review: approved
sources:
  - "First Attempt: Large-Cluster Aggregate"
  - "Common Usage Scenarios"
  - "Optimistic Concurrency"
---

# AGG-15 · Chaque aggregate est protégé par l’optimistic concurrency

<RuleMeta />

## Signal

- Le repository enregistre l’aggregate sans vérifier sa version : une mise à jour sans condition sur la version, ou une version incrémentée mais jamais comparée.
- Un invariant porte sur plusieurs parties (la somme des lignes sous un plafond, l’unicité dans une collection), alors que seule la version des parties modifiées est vérifiée.
- La vérification de version est désactivée pour faire disparaître les conflits sur un gros aggregate.

## Pourquoi

La version protège les invariants contre les modifications concurrentes. Si seules les parties sont versionnées, deux modifications concurrentes de deux parties différentes réussissent chacune, et ensemble elles cassent l’invariant de l’aggregate root. Désactiver la vérification cache un aggregate trop gros (AGG-11, AGG-12) sans le corriger.

## Exceptions

- Un aggregate stocké en une seule valeur, dans un stockage qui détecte lui-même les conflits.
- Ne versionner que les parties quand aucun invariant ne les lie.
- Ne pas faire avancer la version de l’aggregate root lors d’ajouts à une collection, si ces ajouts ne touchent aucun invariant et que la taille reste maîtrisée.

## Correction

Versionner l’aggregate root et vérifier la version à chaque enregistrement.

## Adaptation

Quand le repository enregistre l’aggregate entier, le plus simple est une mise à jour conditionnée par la version de l’aggregate root, à chaque enregistrement, même quand seules des parties ont changé.

**Notre choix** : avec Prisma, un `updateMany` filtré sur l’identité et la version attendue, qui incrémente la version. Zéro ligne modifiée signale un conflit, traduit en une erreur de concurrence nommée (REP-03).
