---
code: EVT-06
title: Un event est immuable
group: Modéliser l’event
scope: [domain]
style: [tactical]
severity: major
review: approved
sources:
  - "Modeling Events"
---

# EVT-06 · Un event est immuable

<RuleMeta />

## Signal

Un event avec des setters, des champs modifiables, ou modifié après sa création (un handler qui l’enrichit sur place).

## Pourquoi

Un event est en principe immuable. Il est construit d’un bloc, avec tout son état, et ses propriétés sont en lecture seule. Tout état dérivé vient de fonctions sans effet de bord, comme pour un value object.

## Exceptions

Aucune.

## Correction

Des champs `readonly`, une construction complète, aucun setter.

## Voir aussi

VO-03 pose la même règle pour les value objects.
