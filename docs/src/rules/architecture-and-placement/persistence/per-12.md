---
code: PER-12
title: Une migration change la forme des données, jamais leurs faits métier
group: Migrations
scope: [schema]
style: [tactical, transaction-script]
severity: blocking
detection: []
review: approved
sources: []
---

# PER-12 · Une migration change la forme des données, jamais leurs faits métier

<RuleMeta />

## Signal

- `UPDATE wallet SET balance = …` dans une migration, pour corriger les soldes après un bug.
- Un script qui supprime des écritures comptabilisées deux fois.
- Un statut changé en SQL, sans l’event que les autres bounded contexts attendent.

## Pourquoi

Un fait métier passe par son use case : ses règles s’appliquent, ses events sont enregistrés, et son historique montre qui a changé quoi. Réécrit en SQL, le solde ne correspond plus à ses écritures, les autres bounded contexts n’apprennent jamais le changement, et plus personne ne sait expliquer le chiffre ensuite.

Une erreur dans les faits se corrige par un nouveau fait : une contre-passation, une écriture de correction, un ajustement validé par quelqu’un, à travers le use case prévu pour cela.

## Exceptions

Remplir une nouvelle colonne à partir de données déjà là (PER-11), quand la valeur est dérivée et ne change aucun fait : la devise d’un wallet recopiée dans chacune de ses écritures.

## Correction

La migration change des tables, des colonnes et des index. La correction passe par une command, lancée par une commande en ligne (PLC-10) ou par un opérateur, avec ses règles et ses events.

## Voir aussi

REP-06 garde ce que le métier doit garder. MSG-01 enregistre les events avec l’état. PLC-10 fait passer les traitements ponctuels par un use case.
