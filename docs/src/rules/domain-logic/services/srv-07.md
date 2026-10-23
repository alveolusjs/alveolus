---
code: SRV-07
title: Un domain service renvoie le minimum utile
group: Forme du service
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "Make Sure You Need a Service (UserDescriptor)"
---

# SRV-07 · Un domain service renvoie le minimum utile

<RuleMeta />

## Signal

Un domain service qui renvoie un aggregate entier à l’application ou à l’interface, quand une petite valeur suffirait, surtout quand l’aggregate porte des données sensibles.

## Pourquoi

Un domain service renvoie ce dont l’appelant a besoin, et rien de plus. Un aggregate entier expose tout ce qu’il contient : solde, blocages, historique. Une petite valeur peut passer à l’étape suivante, ou jusqu’à la réponse de l’API, sans rien exposer d’autre.

Par exemple, `WithdrawalLimit.allows()` renvoie un booléen : le retrait est autorisé ou non. Il ne rend ni le total des retraits des dernières 24 heures, ni le wallet. Quand l’appelant a besoin de plus, un petit value object nommé dans le langage suffit.

## Exceptions

Un appelant qui doit ensuite appeler une méthode métier de l’aggregate.

## Correction

Un value object de résultat, nommé dans le langage, qui ne porte que le nécessaire.

## Voir aussi

ENT-13 ne laisse pas sortir les secrets de l’entity.
