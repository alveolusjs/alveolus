---
code: ENT-07
title: Deux entities sont égales si leurs identités le sont
group: Identité
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "When the Timing of Identity Generation Matters"
---

# ENT-07 · Deux entities sont égales si leurs identités le sont

<RuleMeta />

## Signal

Deux entities comparées par référence (`===`) ou par égalité profonde de leurs attributs.

## Pourquoi

L’égalité de deux entities repose sur leur identité unique, pas sur leurs autres attributs. Une entity reste la même à travers tous ses changements d’état.

## Exceptions

Une égalité sur d’autres attributs tant que l’identité n’existe pas encore. C’est acceptable, mais la génération précoce est préférable (ENT-05).

## Correction

Un `equals(other)` sur la classe de base des entities, qui compare les identités typées.

## Adaptation

TypeScript n’a pas de contrat `equals`. Deux instances chargées séparément ne sont jamais `===`. Il faut donc une méthode `equals` explicite sur l’identité, que la classe de base des entities appelle. En multi-tenant, elle inclut le tenant (ENT-09).
