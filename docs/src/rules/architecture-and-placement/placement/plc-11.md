---
code: PLC-11
title: "Le code généré vit dans un dossier `generated/` et ne se modifie jamais à la main"
group: Dans la durée
scope: [structure]
style: [tactical, transaction-script]
severity: minor
review: approved
sources: []
---

# PLC-11 · Le code généré vit dans un dossier `generated/` et ne se modifie jamais à la main

<RuleMeta />

## Signal

- Un fichier généré modifié à la main : la génération suivante efface la modification.
- Du code généré mêlé au code écrit, sans dossier qui le distingue.
- Des types générés à partir de l’API d’un provider importés hors de son anticorruption layer (ACL-01).
- Aucune commande pour régénérer, ou un résultat qui dépend de la machine.

## Pourquoi

Le code généré a une source : un schéma Prisma, la spécification d’une API, une context map. C’est la source qui fait foi. Retouché à la main, le code généré ment sur sa source, et la retouche disparaît sans bruit à la génération suivante.

Rangé dans son propre dossier, il se reconnaît d’un coup d’œil. Le lecteur sait qu’il ne doit pas le lire comme du code écrit, et l’outillage l’écarte de ses contrôles (NAM-01).

## Exceptions

Aucune.

## Correction

```txt
src/wallets/driven/http/rates-provider/
├── generated/                          les types générés à partir de l’API du provider
├── http-exchange-rates.adapter.ts
└── rates-provider.translator.ts        traduit les types générés en concepts du modèle
```

Une seule commande régénère tout le code généré du projet. Pour changer le code généré, on change sa source, puis on régénère.

## Adaptation

**Notre choix** : la CI régénère le code généré et échoue si le résultat diffère de ce que la MR apporte. Un code généré à partir de l’API d’un provider ne sort pas de son anticorruption layer (ACL-01).

## Voir aussi

NAM-01 écarte les dossiers `generated/` de la liste des rôles. ACL-01 réunit la traduction d’un système upstream dans un seul dossier.
