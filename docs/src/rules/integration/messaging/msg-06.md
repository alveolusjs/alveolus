---
code: MSG-06
title: L’ordre des events est respecté ou toléré
group: Consommation
scope: [driving]
style: [tactical, transaction-script]
severity: major
severityNote: Majeure quand l’ordre change le résultat. Question sinon.
review: approved
sources:
  - "Publishing Notifications as RESTful Resources"
  - "Implementation › Event De-duplication"
---

# MSG-06 · L’ordre des events est respecté ou toléré

<RuleMeta />

## Signal

Un consumer qui applique des events dont l’ordre compte, sans garantie d’ordre :

- un flux traité en parallèle ;
- des events récents traités avant des plus anciens ;
- aucune défense contre un event en retard.

## Pourquoi

Les events d’un flux s’appliquent dans l’ordre chronologique, du plus ancien au plus récent. Sinon, les changements du modèle local peuvent produire des bugs. Les messages peuvent arriver dans le désordre : avec un broker, ou après un retry.

## Exceptions

Des events dont l’ordre ne compte pas pour le subscriber.

## Correction

Traiter dans l’ordre de séquence de la source. Ou rendre le traitement tolérant au désordre, par exemple en ignorant un event plus ancien que l’état déjà appliqué.

## Voir aussi

ACL-04 montre la technique pour une copie locale : une date de dernier changement par groupe d’attributs. MSG-03 publie dans l’ordre.
