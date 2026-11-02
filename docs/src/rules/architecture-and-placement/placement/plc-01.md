---
code: PLC-01
title: "Un bounded context est un dossier de `src`, avec sa composition, ses couches et son contrat"
group: L’application
scope: [structure]
style: [tactical, transaction-script]
kind: structure
severity: major
detection: []
review: approved
sources: []
---

# PLC-01 · Un bounded context est un dossier de `src`, avec sa composition, ses couches et son contrat

<RuleMeta />

## Signal

- Le code d’un bounded context éparpillé dans plusieurs dossiers de premier niveau : `src/controllers/wallets.controller.ts`, `src/services/wallet.service.ts`.
- Le dossier d’un bounded context sans son module, ou avec des couches nommées autrement d’un bounded context à l’autre.
- Une couche à la racine du bounded context, à côté de `public`, au lieu d’être dans `internal` : `src/wallets/domain/`.
- Un fichier à la racine du bounded context : `src/wallets/wallets.module.ts`, `src/wallets/event-handlers.composition.ts`.
- Un dossier de premier niveau de `src` qui n’est ni un bounded context, ni `shared`.

## Pourquoi

Un bounded context est une frontière. Quand son code tient dans un seul dossier, la frontière se voit dans l’arborescence : ce qui appartient au bounded context, ce qu’il publie, ce dont il dépend. `internal` et `public` côte à côte la rendent visible jusque dans le dossier : un import qui entre dans `internal` depuis un autre bounded context se voit dans son chemin. Réparti dans des dossiers par type de fichier, un bounded context se dissout, et personne ne sait plus où il s’arrête.

## Exceptions

Aucune.

## Correction

Un dossier par bounded context dans `src`, à son nom :

- `composition/` : sa composition root, `<context>.module.ts` (WIR-01), `<context>.config.ts` (WIR-11), et les fichiers `<sujet>.composition.ts` d’un module qui grossit ;
- `internal/` : ses couches, `domain`, `application`, `driving`, `driven` pour un bounded context tactique, `application`, `driving`, `driven` pour un bounded context en transaction scripts (TXS-05) ;
- `public/` : son published language, à côté de `internal` ;
- `__test__` : ses tests boîte noire (TST-05).

## Voir aussi

CTX-14 déclare le style de chaque bounded context. PLC-04 découpe le domaine par concept.
