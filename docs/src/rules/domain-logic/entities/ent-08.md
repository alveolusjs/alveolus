---
code: ENT-08
title: L’id technique de persistance reste caché
group: Identité
scope: [domain, driven, schema]
style: [tactical]
severity: minor
detection: hybrid
review: approved
sources:
  - "Unique Identity › Surrogate Identity"
---

# ENT-08 · L’id technique de persistance reste caché

<RuleMeta />

## Signal

Un id technique (clé primaire numérique, id imposé par l’ORM) visible dans le modèle, utilisé par le code métier, ou exposé dans une API ou un event, à côté de l’identité du domaine ou à sa place.

## Pourquoi

Quand l’ORM impose son propre id, on se retrouve avec deux identités. L’id technique ne fait pas partie du modèle. Le montrer fait fuir un détail de persistance dans le modèle.

Le cacher dans une classe de base, en `protected`. Ajouter en base une contrainte d’unicité sur l’identité du domaine.

## Exceptions

Une table héritée, déjà indexée sur une clé numérique, dont on ne contrôle pas le schéma. L’id technique reste alors dans `driven`, documenté par un waiver.

## Correction

Cacher l’id technique dans la couche de persistance (`driven`), et n’exposer que l’identité du domaine.

## Adaptation

Avec un repository écrit à la main, le plus simple est souvent de prendre l’identité du domaine comme clé primaire, sans id technique. L’id technique n’existe que pour satisfaire l’ORM.

**Notre choix** : l’identité du domaine, un UUIDv7, est la clé primaire (type `uuid` de PostgreSQL). Pas d’id technique.

## Voir aussi

AGG-05 sépare déjà l’identité de l’aggregate root de tout id technique.
