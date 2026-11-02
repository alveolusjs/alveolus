---
code: PLC-07
title: Une technologie n’est importée que dans son dossier
group: Adapters
scope: [driving, driven]
style: [tactical, transaction-script]
kind: structure
severity: major
detection: [eslint]
review: approved
sources: []
---

# PLC-07 · Une technologie n’est importée que dans son dossier

<RuleMeta />

## Signal

`@nestjs/swagger` importé dans un consumer, `@prisma/client` dans un translator.

## Pourquoi

Une technologie importée hors de son dossier se répand : la remplacer oblige à toucher des fichiers qui ne devraient pas la connaître. Gardée dans son dossier, elle se remplace ou se retire en un seul endroit, et l’outillage peut le vérifier.

## Exceptions

Un fichier de wiring (`*.module.ts`, `*.bootstrap.ts`) importe toutes les technologies qu’il assemble.

Dans un bounded context en transaction scripts, les scripts utilisent Prisma dans `application` (TXS-06).

## Correction

Importer chaque technologie seulement dans son dossier de `driving` ou de `driven` (PLC-13). Ce dont un autre dossier a besoin passe par un port.

## Voir aussi

PLC-13 découpe les adapters par technologie. LAY-01 fixe le sens des dépendances.
