---
code: PLC-06
title: Les modules évoluent avec le modèle
group: Modules
scope: [structure]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources:
  - "Designing with Modules (Table 9.1)"
---

# PLC-06 · Les modules évoluent avec le modèle

<RuleMeta />

## Signal

- Un concept renommé dans le diff, alors que son module garde l’ancien nom.
- Un nouveau concept placé dans un module dont le nom ne lui convient plus.

## Pourquoi

Les modules ne sont pas figés. Ils naissent, changent de nom et disparaissent avec les concepts qu’ils organisent.

Renommer un module existant doit être aussi naturel qu’en créer un. C’est fastidieux, mais moins que de vivre avec des modules mal nommés.

## Exceptions

Aucune.

## Correction

Renommer ou déplacer le module dans la même MR que le concept.
