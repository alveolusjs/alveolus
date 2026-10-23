---
code: PLC-05
title: Les noms des modules viennent du langage
group: Modules
scope: [structure]
style: [tactical, transaction-script]
severity: minor
review: approved
sources:
  - "Designing with Modules (Evans quote, Table 9.1)"
  - "Module Naming Conventions for the Model"
---

# PLC-05 · Les noms des modules viennent du langage

<RuleMeta />

## Signal

- Dans le domaine, un module au nom générique ou technique (`common`, `utils`, `helpers`, `core`, `misc`, `manager`).
- Un dossier de premier niveau nommé d’après un produit ou une marque, plutôt que d’après le bounded context.
- Un nom absent du langage de l’équipe.

## Pourquoi

Les noms des modules font partie de l’ubiquitous language : les lire doit dire de quoi parle le système. On les choisit avec le même soin que ceux des entities ou des events.

Pas de nom de produit commercial. Une marque peut changer, pour des raisons juridiques ou culturelles. Elle correspond mal, aussi, au bounded context dont parle l’équipe. Le dossier de premier niveau de `src` porte le nom du bounded context (PLC-01).

## Exceptions

Aucune.

## Correction

Nommer chaque module d’après le concept du glossaire qu’il contient, et le dossier de premier niveau d’après le bounded context.

## Voir aussi

CTX-03 quand un glossaire existe, ENT-11 pour le nommage des classes.
