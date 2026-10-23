---
code: PLC-02
title: "`shared` ne contient que du code technique"
group: L’application
scope: [structure]
style: [tactical, transaction-script]
severity: major
detection: LLM
review: approved
sources: []
---

# PLC-02 · `shared` ne contient que du code technique

<RuleMeta />

## Signal

- Un dossier `shared/domain`, ou un type métier dans `shared` : `Money`, `Customer`, `TransferStatus`.
- Un dossier `shared/utils` qui grossit avec chaque bounded context.
- Un bounded context qui importe une règle métier depuis `shared`, au lieu du `public` du bounded context qui la possède.

## Pourquoi

`shared` n’appartient à aucun bounded context. Ce qu’on y met échappe à toutes les frontières : aucune équipe ne le possède, et tous les bounded contexts peuvent en dépendre. Le code technique (client de base de données, Unit of Work, outbox, configuration HTTP globale) est le même pour tous. Le code métier, non : un concept partagé sans déclaration cache une relation entre bounded contexts.

## Exceptions

Un shared kernel déclaré dans la context map (MAP-03). Il a son propre dossier, à son nom, et ses propriétaires.

## Correction

Ne garder dans `shared` que le wiring technique et la mise en place de ses tests :

```txt
src/shared/
├── shared.module.ts
├── shared.config.ts
├── driven/prisma/      client Prisma, Unit of Work, outbox
├── driving/http/       pipe global, référence de l’API
└── __test__/           mise en place de la base, helpers transverses
```

Déplacer un concept métier dans le bounded context qui le possède, et laisser les autres le lire à travers son `public`.

## Voir aussi

MAP-03 encadre le shared kernel. CTX-04 tient les concepts étrangers hors du modèle.
