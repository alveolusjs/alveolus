---
code: ENT-06
title: L’identité ne change jamais
group: Identité
scope: [domain]
style: [tactical]
severity: major
detection: []
review: approved
sources:
  - "Unique Identity › Identity Stability"
---

# ENT-06 · L’identité ne change jamais

<RuleMeta />

## Signal

- Un setter ou une méthode publique qui change l’identité, ou un attribut qui en fait partie (par exemple `walletId` et `period` pour un `Statement`).
- Un champ d’identité qui n’est pas `readonly`.

## Pourquoi

Dans la plupart des cas, l’identité doit rester stable pendant toute la vie de l’entity. Les setters d’identité sont privés. Ils refusent toute seconde affectation, et un test le prouve.

## Exceptions

La reconstitution depuis la persistance, qui affecte l’identité une seule fois.

## Correction

`readonly`, aucune méthode de modification, et un test qui vérifie que l’identité ne change pas.

## Voir aussi

AGG-05 l’exige déjà pour l’identité de l’aggregate root : fixée à la construction, jamais modifiée.
