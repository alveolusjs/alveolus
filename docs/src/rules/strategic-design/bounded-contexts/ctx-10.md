---
code: CTX-10
title: Les composants autour du modèle délèguent
group: Ce que contient un bounded context
scope: [driving]
style: [tactical, transaction-script]
severity: major
severityNote: Majeure pour une règle métier hors du modèle. Mineure pour un endpoint qui contourne le use case.
detection: hybrid
detectionNote: Un adapter driving qui injecte un repository, jugement pour les règles.
review: approved
sources:
  - "Room for More than the Model"
  - "Sample Contexts › Collaboration Context (the way out through Segregated Core)"
---

# CTX-10 · Les composants autour du modèle délèguent

<RuleMeta />

## Signal

- Un adapter `driving` (controller, resolver, consumer de messages) ou un composant d’interface qui prend une décision métier, ou qui utilise le modèle sans passer par un use case.
- Une vérification d’accès dans le domaine au lieu d’avant lui.

## Pourquoi

L’interface, les endpoints REST, les consumers de messages et les use cases appartiennent au bounded context, mais ils ne modélisent pas le domaine. Les endpoints délèguent aux use cases. Les use cases gèrent la sécurité, les transactions et la traduction, puis appellent le modèle.

Mettre le domaine dans l’interface donne un anemic model : c’est l’anti-pattern Smart UI.

## Exceptions

Aucune.

## Correction

Les décisions métier vont dans le modèle. L’orchestration et la sécurité vont dans le use case.

## Voir aussi

AGG-01 et ENT-10 couvrent une règle métier décidée dans la couche application. CTX-10 étend ce principe aux endpoints et à l’interface.
