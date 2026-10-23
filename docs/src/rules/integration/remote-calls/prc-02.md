---
code: PRC-02
title: Limiter les dépendances en temps réel
group: Appels distants
scope: [application, driven]
style: [tactical, transaction-script]
severity: question
severityNote: Majeure si l’échec de l’appel distant n’est pas traité du tout.
detection: hybrid
detectionNote: Le client d’un autre bounded context appelé dans un command handler ; le jugement pour le reste.
review: approved
sources:
  - "Mapping the Three Contexts (autonomie)"
  - "Mapping the Three Contexts › Collaboration Context (the cost of RPC)"
  - "Agile Project Management Context"
  - "Integration with the Collaboration Context"
---

# PRC-02 · Limiter les dépendances en temps réel

<RuleMeta />

## Signal

- Une command appelle un autre bounded context de façon synchrone, pour obtenir des données qui pourraient être gardées localement.
- Une command crée une ressource dans un autre bounded context pendant son exécution, et échoue si ce bounded context est indisponible.
- Un appel distant sans aucun traitement de l’échec.

## Pourquoi

Un appel distant ressemble à un appel local, mais il peut être lent ou échouer. Si l’autre bounded context est indisponible, toute l’exécution locale échoue.

Mieux vaut un traitement asynchrone : un état local minimal, posé par quelques appels bien placés, puis tenu à jour par les notifications de l’upstream.

Pour créer une ressource distante, un domain event local déclenche un handler. Le handler réessaie jusqu’à réussir, puis rattache la nouvelle identité à l’aggregate.

## Exceptions

Un RPC synchrone choisi exprès, quand le métier a besoin d’une réponse immédiate, avec un message clair à l’utilisateur en cas d’échec. Le compromis est acceptable s’il est fait en connaissance de cause.

## Correction

Par ordre de préférence :

1. un état local synchronisé par des notifications ;
2. peu d’appels distants, chacun protégé (PRC-01).

## Voir aussi

PRC-01 pour faire l’appel quand il reste nécessaire. AGG-08 pour la discipline des handlers : retry, échec.
