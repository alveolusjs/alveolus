---
code: REP-04
title: Le repository se comporte comme un ensemble indexé par identité
group: Contrat
scope: [driven, schema]
style: [tactical]
severity: blocking
severityNote: 'Mineure quand seul le contrat commun manque : un repository qui n’étend pas `CommandRepository`.'
detection: []
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
- Un repository du domaine qui étend `Port`, ou aucune classe, au lieu de `CommandRepository` : il perd le contrat commun, souvent parce qu’il lui manquait une lecture de plusieurs aggregates.

## Pourquoi

Le repository imite un `Set`. Chaque aggregate a une identité globale, portée par son aggregate root. Cette identité empêche d’ajouter deux fois la même instance.

Un ajout en double peut ne rien faire, ou échouer. Il ne crée jamais de doublon.

## Exceptions

Aucune.

## Correction

Prendre l’identité du domaine comme clé, ou au moins la placer sous une contrainte d’unicité. `save` insère ou met à jour selon l’identité, avec la vérification de version d’AGG-15.

## Adaptation

**Notre choix** : chaque repository du domaine étend `CommandRepository<Aggregate, Refusal>` de `@alveolus/core`, et une view se lit par `QueryRepository` (REP-11). `CommandRepository` donne le contrat d’un ensemble : `findById` et `save`, que l’adapter implémente, et `findByIds`.

`findByIds` lit plusieurs aggregates par leurs identités. Il renvoie ceux qu’il a trouvés, dans l’ordre demandé, et les identités qu’il n’a pas trouvées (`{ found, missing }`) : l’appelant n’a pas à comparer les longueurs (REP-03). Une identité demandée deux fois n’est lue qu’une fois. Par défaut, `CommandRepository` l’implémente en appelant `findById` pour chaque identité. Un adapter la remplace par une seule requête quand le nombre compte, ou pour verrouiller les lignes.

Lire plusieurs aggregates ne donne pas le droit d’en modifier plusieurs dans la transaction (AGG-06, AGG-07).

## Voir aussi

AGG-05 donne à l’aggregate root une identité globale. ENT-08 prend l’identité du domaine comme clé primaire.
