---
code: PER-10
title: Le schéma change par des migrations commitées
group: Migrations
scope: [schema, tests, structure]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# PER-10 · Le schéma change par des migrations commitées

<RuleMeta />

## Signal

- `prisma db push` contre une base partagée.
- Un changement du schéma Prisma sans migration dans la même MR.
- Une migration déjà appliquée, puis modifiée.
- Une colonne ajoutée à la main en production.

## Pourquoi

La base survit à toutes les versions du code. Une migration est la trace de chaque changement : relue en SQL, appliquée dans le même ordre partout, et rejouable sur une base vide. Sans elle, les environnements divergent, et la migration suivante échoue en production sur une colonne qui n’existe nulle part ailleurs.

## Exceptions

Aucune.

## Correction

- `prisma migrate dev` crée la migration, commitée avec le changement du schéma, et relue en SQL.
- Le déploiement lance `prisma migrate deploy` avant que la nouvelle version ne démarre.
- Une migration appliquée ne se modifie jamais : une erreur se corrige par une nouvelle migration.
- Les tests construisent leur base à partir des mêmes migrations : les migrations sont testées elles aussi.

## Voir aussi

PER-11 garde chaque migration compatible avec la version qui tourne. PER-01 place les fichiers de schéma.
