---
code: PLC-01
title: "Un bounded context est un dossier de `src`, avec son module, sa configuration et ses couches"
group: L’application
scope: [structure]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# PLC-01 · Un bounded context est un dossier de `src`, avec son module, sa configuration et ses couches

<RuleMeta />

## Signal

- Le code d’un bounded context éparpillé dans plusieurs dossiers de premier niveau : `src/controllers/wallets.controller.ts`, `src/services/wallet.service.ts`.
- Le dossier d’un bounded context sans son module, ou avec des couches nommées autrement d’un bounded context à l’autre.
- Un dossier de premier niveau de `src` qui n’est ni un bounded context, ni `shared`.

## Pourquoi

Un bounded context est une frontière. Quand son code tient dans un seul dossier, la frontière se voit dans l’arborescence : ce qui appartient au bounded context, ce qu’il publie, ce dont il dépend. Réparti dans des dossiers par type de fichier, un bounded context se dissout, et personne ne sait plus où il s’arrête.

## Exceptions

Aucune.

## Correction

Un dossier par bounded context dans `src`, à son nom :

- `<context>.module.ts` : le wiring du bounded context ;
- `<context>.config.ts` : sa configuration (WIR-11) ;
- ses couches : `domain`, `application`, `driving`, `driven`, `public` pour un bounded context tactique ; `application`, `driving`, `driven`, `public` pour un bounded context en transaction scripts (TXS-05) ;
- `__test__` : ses tests boîte noire (TST-05).

## Voir aussi

CTX-14 déclare le style de chaque bounded context. PLC-04 découpe le domaine par concept.
