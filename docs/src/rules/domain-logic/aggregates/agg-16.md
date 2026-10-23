---
code: AGG-16
title: Le versioning reste hors du code métier
group: Concurrence
scope: [domain, driven]
style: [tactical]
severity: minor
review: approved
sources:
  - "Optimistic Concurrency"
---

# AGG-16 · Le versioning reste hors du code métier

<RuleMeta />

## Signal

- Une méthode métier incrémente elle-même la version (`this.version++`).
- Une association d’une partie vers l’aggregate root, ajoutée seulement pour transmettre ses changements au versioning.

## Pourquoi

C’est un souci de persistance qui fuit dans le modèle. Incrémenter à chaque appel fait aussi avancer la version de l’aggregate root quand la méthode n’a rien changé. Éviter les associations bidirectionnelles en général, et plus encore pour cela.

## Exceptions

Modifier une propriété métier légitime de l’aggregate root (un statut), qui fait naturellement avancer la version.

## Correction

Le repository gère la version (AGG-15). Si un changement d’une partie fait difficilement avancer la version de l’aggregate root, c’est un signe : réduire l’aggregate à un aggregate root et des value objects.
