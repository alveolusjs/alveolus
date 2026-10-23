---
code: CTX-09
title: Le schéma de la base parle le langage du modèle
group: Ce que contient un bounded context
scope: [schema]
style: [tactical, transaction-script]
severity: minor
detection: hybrid
detectionNote: Comparer les noms des migrations au modèle et au glossaire.
review: approved
sources:
  - "Room for More than the Model"
---

# CTX-09 · Le schéma de la base parle le langage du modèle

<RuleMeta />

## Signal

Dans un schéma que l’équipe du bounded context conçoit et maintient, des tables ou des colonnes nommées avec un autre vocabulaire que celui du modèle (abréviations, ancien nom, terme que le glossaire rejette).

## Pourquoi

Quand le modèle guide le schéma, le schéma est à l’intérieur de la frontière du bounded context. Ses noms reprennent alors ceux du modèle, sans traduction.

## Exceptions

- Un schéma qui existait avant, ou imposé par une équipe de modélisation des données distincte. Il est alors hors du bounded context, et la traduction est voulue.
- Une convention de casse (`standing_order` pour `StandingOrder`) n’est pas une traduction.

## Correction

Aligner les noms dans la prochaine migration, ou documenter que le schéma est hors de la frontière.
