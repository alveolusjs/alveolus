---
code: REP-03
title: L’interface du repository ne laisse rien fuir du stockage
group: Contrat
scope: [domain, driven]
style: [tactical]
severity: minor
severityNote: Majeure si l’erreur brute du stockage atteint la réponse de l’API.
detection: []
review: approved
sources:
  - "Collection-Oriented Repositories"
  - "Hibernate Implementation"
---

# REP-03 · L’interface du repository ne laisse rien fuir du stockage

<RuleMeta />

## Signal

- Une interface de repository qui accepte des options d’ORM (`FindOptionsWhere`, `Prisma.TransferWhereInput`), un query builder ou un fragment SQL.
- Une erreur du driver ou de l’ORM qui atteint l’application ou le controller (`QueryFailedError`, le code Postgres `23505` testé hors de `driven`).
- Un `add` ou un `save` qui renvoie un booléen de succès.
- Un finder qui renvoie un `Err` pour un aggregate absent (`WalletNotFound`).
- Un finder par lot qui renvoie moins d’aggregates que d’identités demandées, sans dire lesquelles manquent.

## Pourquoi

L’interface du repository ressemble à une collection. Elle ne laisse rien deviner du stockage qui se trouve derrière. Puisqu’on abstrait le framework de persistance, l’appelant doit en être entièrement isolé, exceptions comprises.

L’implémentation attrape la violation de contrainte de l’ORM et la traduit. Une unicité énoncée par le métier devient un refus nommé dans son langage ; tout autre échec devient une exception que l’appelant comprend. Jamais un booléen : il ne dit ni ce qui a échoué, ni si le commit tiendra.

Chaque issue a son canal. Un refus métier est un `Err`. Une absence est `undefined` : ce n’est pas un refus du repository. Ne rien trouver peut être le cas normal, comme pour une demande pas encore reçue. Et seul le use case sait quel refus faire d’un wallet absent : celui de l’émetteur, celui du bénéficiaire, ou aucun (UC-07). Une panne est une exception.

## Exceptions

Aucune.

## Correction

`save` renvoie un `Result` dont les erreurs sont les refus métier que le stockage fait respecter (`DuplicateTransfer`). Les autres échecs du stockage lancent une exception nommée. Un finder renvoie l’aggregate ou `undefined`, et un finder par lot dit quelles identités il n’a pas trouvées, comme `findByIds` (REP-04). Les paramètres et les valeurs de retour utilisent les types du modèle.

## Adaptation

Quand l’écriture a lieu au commit du Unit of Work, l’erreur de contrainte apparaît au commit, pas dans `add`. L’implémentation du Unit of Work, dans `driven`, la traduit alors.

**Notre choix** : le `save` de chaque repository renvoie `Promise<Result<void, E>>`. `E` liste les règles d’unicité du métier que la base fait respecter (PER-03), comme `WalletAlreadyOpen` pour un second wallet dans la même devise, ou `never` s’il n’y en a pas. Le use case renvoie ce refus tel quel. Les échecs du stockage (conflit de version, panne) restent des exceptions nommées, lancées par `driven`. Avec Prisma, les codes comme `P2002` ou `P2025` sont traduits dans le repository et n’en sortent jamais.

`save` renvoie un `Result` même avec `never` : tous les repositories ont la même signature, et un aggregate qui gagne une règle d’unicité ne change pas ses appelants.

La même répartition vaut pour tous les ports, pas seulement les repositories :

| Issue | Canal | Exemple |
| --- | --- | --- |
| Une règle métier refuse | un `Result` dont l’`Err` est nommé | `save` qui refuse `WalletAlreadyOpen` |
| Rien n’est trouvé | `T \| undefined` | `findById` |
| L’opération échoue | une exception nommée | une panne, un conflit de version |

Un port qui ne refuse jamais, comme `Clock`, ne renvoie pas de `Result`.

## Voir aussi

LAY-01 vise la dépendance du domaine envers l’ORM. Cette règle vise ce qui fuit par les signatures et les erreurs. UC-07 transforme l’absence en refus nommé, dans le use case.
