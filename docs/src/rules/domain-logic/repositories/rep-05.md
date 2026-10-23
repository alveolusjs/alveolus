---
code: REP-05
title: Aucun changement ne se perd entre l’aggregate et le stockage
group: Écritures
scope: [application, driven]
style: [tactical]
severity: major
detection: hybrid
detectionNote: Un use case qui appelle une méthode métier sur un aggregate chargé, sans save sur le repository correspondant.
review: approved
sources:
  - "Collection-Oriented Repositories"
  - "Persistence-Oriented Repositories (and chapter note 3)"
---

# REP-05 · Aucun changement ne se perd entre l’aggregate et le stockage

<RuleMeta />

## Signal

- Un repository orienté collection (`add`, sans `save`) dont l’implémentation ne suit pas les changements des objets chargés. Chaque changement d’un aggregate existant se perd.
- En style orienté persistance, un use case qui charge un aggregate, appelle une méthode métier, et ne l’enregistre pas.
- Un repository qui mélange les deux styles, sans règle claire.

## Pourquoi

Le style orienté collection a besoin d’un outil qui suit les changements des objets chargés. Sans cet outil, prendre un repository orienté persistance : un `save` après chaque création et chaque changement.

Ce style est aussi recommandé quand le stockage peut changer. Changer de style plus tard oblige à ajouter des `save` dans toute la couche application.

Son défaut : sur un ORM doté d’un Unit of Work qui suit les changements, un `save` oublié ne casse rien, jusqu’au jour où ce Unit of Work disparaît.

## Exceptions

En style orienté collection, sur un outil qui suit vraiment les changements, l’absence de `save` après un changement est normale. Un `save` de trop ne casse rien ; il est seulement inutile.

## Correction

Style orienté persistance : un `save` à la fin de chaque command. Les tests d’application vérifient les enregistrements en rechargeant l’aggregate depuis la base (REP-16).

## Adaptation

En Node, la plupart des outils (TypeORM, Prisma, Knex, `pg`) ne suivent pas les changements des objets chargés. Le style orienté persistance est donc le défaut. MikroORM fait exception, avec son Unit of Work et `flush()`.

Un repository écrit à la main, qui fait le mapping vers les objets du domaine, est toujours orienté persistance.

**Notre choix** : Prisma, donc le style orienté persistance : un `save` explicite après chaque création et chaque changement.
