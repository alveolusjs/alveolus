---
code: LAY-03
title: Ne pas sacrifier le typage pour découpler
group: Sens des dépendances
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "Modules of the Agile Project Management Context (the generic Identity type)"
---

# LAY-03 · Ne pas sacrifier le typage pour découpler

<RuleMeta />

## Signal

Des identités typées remplacées par un type générique (`Identity`, `string`), pour éviter d’importer le module d’un autre concept.

## Pourquoi

Un type d’identité générique pourrait découpler les modules. Nous ne l’utilisons pas : il laisse passer des bugs où une identité est prise pour une autre. Dépendre du type d’identité d’un module voisin est un couplage acceptable.

## Exceptions

Aucune.

## Correction

Garder l’identité typée, et accepter la dépendance, dans un seul sens.

## Voir aussi

ENT-03 (l’identité est un value object), LAY-02 pour le sens de la dépendance.
