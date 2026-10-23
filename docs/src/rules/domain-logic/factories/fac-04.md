---
code: FAC-04
title: La factory method crée l’objet et son event, l’appelant l’enregistre en base
group: Règles
scope: [domain, application]
style: [tactical]
severity: major
review: approved
sources:
  - "Creating CalendarEntry Instances"
  - "Creating Discussion Instances"
  - "Chapter 10, 'Second Attempt: Multiple Aggregates'"
---

# FAC-04 · La factory method crée l’objet et son event, l’appelant l’enregistre en base

<RuleMeta />

## Signal

- Une factory method d’aggregate qui enregistre elle-même le nouvel aggregate en base, par un repository.
- Une factory method qui modifie aussi l’aggregate qui crée, par exemple en ajoutant l’élément créé à l’une de ses collections.
- Un use case qui obtient un aggregate de la factory et oublie de l’ajouter au repository.

## Pourquoi

La factory method crée le nouvel aggregate, enregistre son event de création et le renvoie. L’appelant l’ajoute à son repository, sinon l’instance est perdue.

L’aggregate qui crée reste inchangé. La transaction ne modifie ainsi qu’une seule instance.

## Exceptions

Aucune.

## Correction

Le use case appelle la factory method, puis ajoute le résultat au repository. La factory method génère l’identité du nouvel aggregate (ENT-05).

## Voir aussi

AGG-04 interdit le repository dans un aggregate. AGG-06 ne modifie qu’une instance par transaction. ENT-05 fait générer l’identité par la factory method, avant la construction.
