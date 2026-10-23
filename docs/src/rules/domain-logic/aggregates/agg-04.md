---
code: AGG-04
title: Aucun repository ni service injecté dans un aggregate
group: Références et dépendances
scope: [domain]
style: [tactical]
severity: major
detection: hybrid
detectionNote: "dependency-cruiser : un fichier d’aggregate n’importe ni repository ni @nestjs/*."
review: approved
sources:
  - "Model Navigation"
  - "Avoid Dependency Injection"
---

# AGG-04 · Aucun repository ni service injecté dans un aggregate

<RuleMeta />

## Signal

- Un aggregate reçoit un repository, un port ou un service dans son constructeur ou dans une propriété.
- Une méthode d’aggregate fait elle-même une recherche ou des I/O.
- Un decorator NestJS (`@Injectable`, `@Inject`) sur une classe du domaine.
- L’import d’un repository dans un fichier d’aggregate.

## Pourquoi

Un aggregate qui fait ses propres recherches mêle le modèle et les I/O. Il vaut mieux résoudre les dépendances avant d’appeler l’aggregate. Injecter des références dans chaque instance coûte aussi de la mémoire quand le volume est élevé.

## Exceptions

Passer un domain service en paramètre d’une méthode métier, pour une recherche complexe et propre au domaine (double dispatch). L’injection reste normale dans les use cases.

## Correction

Le use case charge ce dont il a besoin par les repositories, puis appelle l’aggregate avec les objets ou les valeurs nécessaires.
