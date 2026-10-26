---
code: SRV-08
title: Les tests couvrent les échecs du domaine et la justesse des calculs
group: Tests
scope: [tests]
style: [tactical]
severity: minor
detection: []
review: approved
sources:
  - "Testing Services"
  - "Is Separated Interface a Necessity?"
---

# SRV-08 · Les tests couvrent les échecs du domaine et la justesse des calculs

<RuleMeta />

## Signal

- Des tests de domain service qui ne couvrent que le cas nominal.
- Un service de calcul sans test de justesse.

## Pourquoi

Les tests montrent comment un appelant se sert du service, échecs du domaine compris. Pour le plafond de retrait : un retrait sous le plafond, un retrait qui l’atteint tout juste et reste autorisé, un retrait qui le dépasse, un montant dans une autre devise, et des retraits de plus de 24 heures qui ne comptent plus.

Tester la justesse des services purement métier, comme les calculs. Un service qui lit par un port se teste sur le vrai adapter, avec une base vidée entre deux tests (TST-01, REP-16).

## Exceptions

Aucune.

## Correction

Un test par issue métier possible (le succès et chaque échec), avec des données réalistes.

## Voir aussi

TST-02 fait lire les tests du domaine dans le langage du métier. TST-01 et REP-16 testent sur la vraie infrastructure.
