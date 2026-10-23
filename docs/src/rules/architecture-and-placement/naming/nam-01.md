---
code: NAM-01
title: Chaque fichier finit par son rôle
group: Noms de fichiers
scope: [structure]
style: [tactical, transaction-script]
severity: minor
detection: fitness
review: approved
sources:
  - "Designing with Modules (Table 9.1)"
---

# NAM-01 · Chaque fichier finit par son rôle

<RuleMeta />

## Signal

- Un `wallet.ts`, `money.ts` ou `debit.ts` nu.
- Un rôle inventé pour l’occasion : `wallet.stuff.ts`, `wallet.utils.ts`, `wallet.helper.ts`.

## Pourquoi

Le dossier nomme le concept (PLC-04) : le nom du fichier a donc la place d’une information de plus, ce qu’est le fichier. `wallet.aggregate.ts`, `wallet.repository.ts` et `wallet.mapper.ts` vivent dans des couches différentes et jouent des rôles différents. Un `wallet.ts` nu pourrait être n’importe lequel des trois. Avec une liste de rôles fermée, le lecteur sait où chercher, le relecteur sait quoi attendre à l’intérieur, et l’outillage sait quoi vérifier.

Un rôle hors de la liste signale un building block qui manque. Un fichier `.helper` contient un comportement qui appartient à un aggregate, à un value object, à un domain service, ou à une méthode privée de la classe qui l’utilise (SRV-01).

## Exceptions

Le code généré, dans les dossiers `generated/` (PLC-11), et les tests, dans les dossiers `__test__` (TST-06).

## Correction

Nommer le fichier d’après son rôle, pris dans la liste de sa couche (PLC-03). Si aucun rôle ne convient, le contenu n’est pas à sa place : le déplacer dans le building block auquel il appartient.

## Adaptation

**Notre choix** : le rôle est un suffixe du nom de fichier, entre le concept et `.ts`. La liste des rôles est fermée, et vit dans PLC-03 : un nouveau rôle s’y ajoute. Pas de `.helper`, de `.utils`, de `.interface` ni de `.type` : ils nomment une sorte de code, pas un rôle.

## Voir aussi

PLC-04 nomme le dossier d’après le concept. PLC-03 dit quels rôles chaque couche accepte.
