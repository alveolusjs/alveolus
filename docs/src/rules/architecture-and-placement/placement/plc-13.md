---
code: PLC-13
title: Les adapters se découpent par technologie
group: Adapters
scope: [driving, driven]
style: [tactical, transaction-script]
kind: convention
convention: layout.by-concept-and-technology
severity: minor
detection: []
review: to-review
sources: []
---

# PLC-13 · Les adapters se découpent par technologie

<RuleMeta />

## Signal

`driving/controllers/`, `driven/repositories/` : des dossiers par type de fichier.

## Pourquoi

Un adapter existe pour une technologie. Regroupés par technologie, les adapters d’une technologie se lisent, se remplacent ou se retirent ensemble. Le dossier d’une technologie est aussi la frontière que PLC-07 fait vérifier par l’outillage.

## Exceptions

Aucune.

## Correction

```txt
driving/
├── http/              controllers, schémas des requêtes et des représentations (NestJS)
└── in-process/        adapter de la facade, consumers des autres bounded contexts
driven/
├── prisma/            repositories, adapters des views, mappers
├── outbox/            traduction des events en integration events
└── http/<upstream>/   client d’un autre système, derrière une anticorruption layer (ACL-01)
```

Tant qu’une technologie compte peu de fichiers, ils restent côte à côte. Quand elle grossit, elle se découpe par concept, jamais par type de fichier : `driving/http/wallet/`, `driven/prisma/wallet/`.

## Voir aussi

PLC-07 garde chaque technologie dans son dossier. ACL-01 réunit la traduction d’un système upstream dans un seul dossier.
