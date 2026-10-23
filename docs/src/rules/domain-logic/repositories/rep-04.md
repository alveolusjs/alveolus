---
code: REP-04
title: Le repository se comporte comme un ensemble indexé par identité
group: Contrat
scope: [driven, schema]
style: [tactical]
severity: major
review: approved
sources:
  - "Collection-Oriented Repositories (take-aways sidebar)"
  - "Hibernate Implementation (saveOrUpdate)"
  - "Considerations for a TopLink Implementation (registerNewObject)"
---

# REP-04 · Le repository se comporte comme un ensemble indexé par identité

<RuleMeta />

## Signal

- Rien n’empêche deux lignes de même identité du domaine (pas de contrainte d’unicité, ou une identité du domaine tenue à part de la clé et non indexée).
- Un `save` écrit comme un simple `INSERT`, qui duplique l’aggregate au second appel.

## Pourquoi

Le repository imite un `Set`. Chaque aggregate a une identité globale, portée par son aggregate root. Cette identité empêche d’ajouter deux fois la même instance.

Un ajout en double peut ne rien faire, ou échouer. Il ne crée jamais de doublon.

## Exceptions

Aucune.

## Correction

Prendre l’identité du domaine comme clé, ou au moins la placer sous une contrainte d’unicité. `save` insère ou met à jour selon l’identité, avec la vérification de version d’AGG-15.

## Voir aussi

AGG-05 donne à l’aggregate root une identité globale. ENT-08 prend l’identité du domaine comme clé primaire.
