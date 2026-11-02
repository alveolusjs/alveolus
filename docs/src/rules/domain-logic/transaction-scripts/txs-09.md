---
code: TXS-09
title: Un script n’appelle aucun autre script
group: Forme d’un script
scope: [application]
style: [transaction-script]
kind: convention
convention: scripts.service-per-concept
severity: minor
detection: []
review: to-review
sources: []
---

# TXS-09 · Un script n’appelle aucun autre script

<RuleMeta />

## Signal

- Une méthode qui appelle une autre méthode publique de son application service, ou d’un autre application service, pour exécuter un second use case.
- Une méthode helper partagée, que plusieurs use cases enchaînent pour construire leur histoire, avec ses propres vérifications et ses propres erreurs.

## Pourquoi

Un script qui en appelle un autre cache un second use case dans le premier, avec ses propres vérifications et ses propres erreurs. Le lecteur doit ouvrir les deux pour savoir ce qui se passe, et les deux finissent par diverger.

## Exceptions

Aucune. Un use case qui doit en déclencher un autre publie un event, ou laisse un scheduler les enchaîner (PRC-05).

## Correction

Une étape partagée par plusieurs scripts du même application service est une méthode privée `#` qui lit ou écrit une seule chose, sans vérification propre. Une règle répétée d’un application service à l’autre signale que le bounded context dépasse son style (TXS-08).

## Voir aussi

TXS-02 garde tout le script dans une seule transaction.
