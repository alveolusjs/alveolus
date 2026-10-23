---
code: FAC-03
title: Le constructeur reste caché quand une factory contrôle la création
group: Règles
scope: [domain]
style: [tactical]
severity: major
detection: hybrid
detectionNote: Les appels à `new X(` hors du module quand une factory method existe.
review: approved
sources:
  - "Creating CalendarEntry Instances (constructeur protected)"
---

# FAC-03 · Le constructeur reste caché quand une factory contrôle la création

<RuleMeta />

## Signal

Un aggregate doté d’une factory method, dont le constructeur reste public et que le code appelle directement.

## Pourquoi

La factory ne garde ses garanties que si les appelants ne peuvent pas la contourner. Un constructeur caché les oblige à passer par la factory method : `holder.openWallet()`, pas `new Wallet(...)`.

## Exceptions

La reconstitution depuis la persistance (ENT-14).

## Correction

Faire de la factory method le seul chemin de création ouvert aux appelants.

## Adaptation

TypeScript n’a pas de visibilité limitée au module. Deux options :

- ne pas exporter la classe ni son constructeur hors du module ;
- marquer le constructeur `@internal` et interdire son usage hors du dossier par une règle de lint.

## Voir aussi

ENT-14 veut une entity complète dès sa naissance. AGG-02 bute sur la même limite de TypeScript.
