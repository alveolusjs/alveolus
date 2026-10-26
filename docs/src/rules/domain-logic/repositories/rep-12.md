---
code: REP-12
title: La logique métier ne descend dans la base que pour une exigence non fonctionnelle
group: Requêtes
scope: [driven, schema]
style: [tactical]
severity: major
detection: []
review: approved
sources:
  - "Additional Behavior"
  - "Repository versus Data Access Object"
---

# REP-12 · La logique métier ne descend dans la base que pour une exigence non fonctionnelle

<RuleMeta />

## Signal

- Une règle métier sous forme de procédure stockée, de trigger ou de fonction SQL (calcul de frais, contrôle de plafond).
- Une requête de repository qui applique une règle du domaine dans un `CASE` ou un `WHERE`, sans exigence de performance documentée.

## Pourquoi

Déplacer le code vers les données peut être nécessaire quand déplacer les données est trop lent. Ce code reste alors sous le contrôle d’un domain service, qui accueille les opérations du domaine sans état.

Sinon, l’éviter. La logique métier dans le stockage va souvent contre le DDD. Les procédures stockées utilisent un langage que l’équipe qui modélise connaît mal, et vivent hors du code qu’elle lit. C’est l’inverse de ce que vise le DDD.

## Exceptions

Une exigence non fonctionnelle documentée. Du code qui s’exécute côté stockage convient s’il est écrit dans le langage de programmation du modèle et suit l’ubiquitous language. Seul le lieu d’exécution change.

## Correction

Garder la règle dans le modèle. Si la performance l’exige, déclarer l’interface d’un domain service dans `domain`, implémentée par la requête dans `driven`, et consigner l’exigence dans une ADR.

## Voir aussi

SRV-01 ne crée un domain service que si l’opération n’appartient à aucun objet. CTX-03 fait suivre au code le glossaire du bounded context.
