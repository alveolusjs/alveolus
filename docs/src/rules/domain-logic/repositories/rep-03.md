---
code: REP-03
title: L’interface du repository ne laisse rien fuir du stockage
group: Contrat
scope: [domain, driven]
style: [tactical]
severity: minor
severityNote: Majeure si l’erreur brute du stockage atteint la réponse de l’API.
detection: hybrid
detectionNote: Des types d’ORM dans les signatures, des classes ou des codes d’erreur du driver utilisés hors de driven/.
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

## Pourquoi

L’interface du repository ressemble à une collection. Elle ne laisse rien deviner du stockage qui se trouve derrière. Puisqu’on abstrait le framework de persistance, l’appelant doit en être entièrement isolé, exceptions comprises.

L’implémentation attrape la violation de contrainte de l’ORM et la traduit. Une unicité énoncée par le métier devient un refus nommé dans son langage ; tout autre échec devient une exception que l’appelant comprend. Jamais un booléen : il ne dit ni ce qui a échoué, ni si le commit tiendra.

## Exceptions

Aucune.

## Correction

`save` renvoie un `Result` dont les erreurs sont les refus métier que le stockage fait respecter (`DuplicateTransfer`). Les autres échecs du stockage lancent une exception nommée. Les paramètres et les valeurs de retour utilisent les types du modèle.

## Adaptation

Quand l’écriture a lieu au commit du Unit of Work, l’erreur de contrainte apparaît au commit, pas dans `add`. L’implémentation du Unit of Work, dans `driven`, la traduit alors.

**Notre choix** : le `save` de chaque repository renvoie `Promise<Result<void, E>>`. `E` liste les règles d’unicité du métier que la base fait respecter (PER-03), comme `WalletAlreadyOpen` pour un second wallet dans la même devise, ou `never` s’il n’y en a pas. Le use case renvoie ce refus tel quel. Les échecs du stockage (conflit de version, panne) restent des exceptions nommées, lancées par `driven`. Avec Prisma, les codes comme `P2002` ou `P2025` sont traduits dans le repository et n’en sortent jamais.

## Voir aussi

LAY-01 vise la dépendance du domaine envers l’ORM. Cette règle vise ce qui fuit par les signatures et les erreurs.
