---
code: ENT-03
title: L’identité est un value object
group: Identité
scope: [domain]
style: [tactical]
severity: minor
detection: hybrid
detectionNote: En revue, repérer le code appelant qui découpe le format brut d’une identité.
review: approved
sources:
  - "Unique Identity"
  - "Unique Identity › Application Generates Identity (ProductId)"
  - "Uncovering Entities and Properties (TenantId)"
---

# ENT-03 · L’identité est un value object

<RuleMeta />

## Signal

- Une identité manipulée comme un `string` ou un `number` nu, surtout quand elle sert partout (l’identité du wallet portée par chaque virement, chaque mouvement et chaque relevé).
- Du code appelant qui découpe le format brut d’une identité pour en tirer une information.

## Pourquoi

Un value object d’identité est immuable : l’identité reste stable. Il garde aussi la logique de l’identité en un seul endroit, au lieu de la disperser dans le modèle et chez ses appelants.

Par exemple, une identité peut rendre la date de création encodée dans sa valeur, sans que l’appelant connaisse le format. Le typage fort empêche aussi de passer un `WalletId` là où un `HolderId` est attendu.

## Exceptions

Aucune.

## Correction

Un value object ou un branded type par identité, qui porte le parsing et la validation de son format.

## Adaptation

**Notre choix** : une classe par identité, avec un champ privé pour que TypeScript ne confonde pas deux identités de même forme. La valeur est un UUIDv7 (ENT-05).

## Voir aussi

AGG-05 l’exige pour les aggregate roots. Cette règle l’étend à toute identité, y compris celles reçues d’un autre bounded context.
