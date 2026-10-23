---
code: EVT-01
title: Un event capture un fait qui compte pour le métier
group: Modéliser l’event
scope: [domain]
style: [tactical]
severity: question
review: approved
sources:
  - "The When and Why of Domain Events"
---

# EVT-01 · Un event capture un fait qui compte pour le métier

<RuleMeta />

## Signal

- Une demande du métier qui dit « quand… », « si cela arrive… », « préviens-moi si… », implémentée sans event explicite.
- Un batch de nuit qui reconstitue ce qui s’est passé dans la journée par des requêtes complexes, pour remettre les données en cohérence.

## Pourquoi

Un domain event modélise quelque chose qui s’est passé et qui compte pour les experts métier. Quand ils parlent, guetter les tournures du Signal.

Un event par fait supprime aussi souvent ces batchs. On sait exactement ce qui s’est passé, et quand. Le traitement avance par petites étapes au fil de la journée, au lieu de grosses requêtes et de longues transactions.

Une fois validés avec les experts métier, les events entrent dans le langage.

## Exceptions

Les faits dont personne ne se soucie.

## Correction

Nommer le fait. L’enregistrer dans la méthode métier qui le produit. Laisser les subscribers réagir.

## Voir aussi

ENT-17 traite de l’historique. EVT-02 distingue les domain events des notifications techniques.
