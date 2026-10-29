---
code: PLC-07
title: Les adapters se découpent par technologie, et une technologie n’est importée que dans son dossier
group: Adapters
scope: [driving, driven]
style: [tactical, transaction-script]
severity: minor
detection: [eslint]
review: approved
sources: []
---

# PLC-07 · Les adapters se découpent par technologie, et une technologie n’est importée que dans son dossier

<RuleMeta />

## Signal

- `driving/controllers/`, `driven/repositories/` : des dossiers par type de fichier.
- `@nestjs/swagger` importé dans un consumer, `@prisma/client` dans un translator.

## Pourquoi

Un adapter existe pour une technologie. Regroupés par technologie, les adapters d’une technologie se lisent, se remplacent ou se retirent ensemble, et l’outillage peut vérifier qu’une technologie ne fuit pas ailleurs.

## Exceptions

Un fichier de wiring (`*.module.ts`, `*.bootstrap.ts`) importe toutes les technologies qu’il assemble.

Dans un bounded context en transaction scripts, les scripts utilisent Prisma dans `application` (TXS-06).

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

ACL-01 réunit la traduction d’un système upstream dans un seul dossier. LAY-01 fixe le sens des dépendances.
