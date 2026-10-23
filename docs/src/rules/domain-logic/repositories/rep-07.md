---
code: REP-07
title: La persistance passe par le repository, pas par l’aggregate ni par l’ORM
group: Écritures
scope: [domain, driven]
style: [tactical]
severity: major
detection: fitness
review: approved
sources:
  - "Hibernate Implementation (persistence through the repository only, versus persistence managed by the aggregate)"
---

# REP-07 · La persistance passe par le repository, pas par l’aggregate ni par l’ORM

<RuleMeta />

## Signal

- Un aggregate qui s’enregistre lui-même (Active Record, `extends BaseEntity` de TypeORM, `transfer.save()`).
- Des hooks ou des subscribers d’ORM (`@AfterInsert`, `@BeforeRemove`, `EntitySubscriberInterface`, extension Prisma) qui écrivent ou suppriment d’autres données en cascade.

## Pourquoi

Seul le repository s’occupe de la persistance. Ne pas compter sur les hooks de cycle de vie de l’ORM pour supprimer les parties en cascade.

Le sujet fait débat, mais en DDD on évite en général qu’un aggregate gère sa propre persistance.

## Exceptions

Un hook purement technique, qui n’écrit aucune donnée du modèle (voir Adaptation).

## Correction

Le repository écrit et supprime explicitement l’aggregate root et ses parties. Les classes du domaine n’héritent d’aucune classe de l’ORM.

## Adaptation

Un hook purement technique, comme un horodatage d’audit sur la même ligne, n’écrit aucune donnée du modèle dans le dos du repository. On peut le tolérer.

**Notre choix** : avec Prisma, les classes du domaine ne sont jamais des modèles Prisma. Une extension du client Prisma (`$extends`) qui écrit d’autres données a le même défaut que les hooks d’ORM.

## Voir aussi

AGG-04 interdit les repositories et les I/O dans un aggregate. REP-02 fait supprimer les parties par le repository.
