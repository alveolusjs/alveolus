---
code: PER-06
title: Une liste est bornée
group: Lectures
scope: [driven, application]
style: [tactical, transaction-script]
kind: convention
convention: persistence.read-performance
severity: minor
severityNote: Majeure pour une liste sans limite derrière la requête d’un titulaire, sur une table qui grossit sans limite.
detection: []
review: approved
sources: []
---

# PER-06 · Une liste est bornée

<RuleMeta />

## Signal

`findMany({ where: { walletId } })` sans `take` : toutes les écritures du wallet, d’un coup.

## Pourquoi

Une liste sans limite fonctionne en test et grossit en production : l’historique d’un wallet actif atteint des centaines de milliers d’écritures, et un seul appel les charge toutes en mémoire.

## Exceptions

Une liste bornée par le métier : les devises qu’un wallet peut tenir, les blocages d’un wallet (AGG-12).

## Correction

Une limite sur chaque liste. Une liste qui ne tient pas en une fois se lit par pages (PER-13).

## Voir aussi

AGG-12 borne les collections d’un aggregate. PER-13 lit par pages sans sauter de ligne. PER-07 appuie la lecture sur un index.
