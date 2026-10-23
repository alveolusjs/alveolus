---
code: AGG-14
title: Préférer des value objects comme parties
group: Frontière et taille
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "Rule: Design Small Aggregates"
  - "Favor Value Object Parts"
---

# AGG-14 · Préférer des value objects comme parties

<RuleMeta />

## Signal

Une partie interne modélisée comme une entity, avec sa propre identité, alors qu’elle est toujours remplacée en entier, jamais modifiée seule et jamais référencée de l’extérieur.

## Pourquoi

Une partie que l’on peut remplacer en entier est un value object. Un value object est plus petit, plus sûr et plus facile à tester. Selon la persistance, il peut être sérialisé avec l’aggregate root, sans table ni jointure.

## Exceptions

Une contrainte de persistance qui rend le remplacement coûteux. Par exemple, un ORM qui supprime et recrée chaque ligne pour réordonner une collection de value objects. Garder la partie en entity se justifie alors.

## Correction

Un value object immuable, remplacé par une méthode métier de l’aggregate root. L’aggregate root lui-même reste modifiable.

## Adaptation

Avec une colonne JSONB ou un aggregate sérialisé en un seul document, cette exception disparaît souvent.
