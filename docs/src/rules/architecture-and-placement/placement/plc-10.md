---
code: PLC-10
title: Un traitement planifié ou ponctuel est un adapter driving qui appelle un use case
group: Dans la durée
scope: [structure, driving]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# PLC-10 · Un traitement planifié ou ponctuel est un adapter driving qui appelle un use case

<RuleMeta />

## Signal

- Un dossier `scripts/`, hors de `src`, dont les fichiers importent le client Prisma et écrivent en base.
- Une correction de données passée à la main en SQL, ou glissée dans une migration (PER-12).
- Un job planifié qui contient des règles métier, ou qui écrit sans passer par un use case.

## Pourquoi

Un script qui écrit directement en base contourne les invariants, les domain events et l’outbox. La base dit alors un état que le modèle n’aurait jamais accepté, et les autres bounded contexts n’en savent rien.

Un traitement lancé à heure fixe ou à la main est un point d’entrée comme un autre. Il traduit son déclencheur, une heure ou une ligne de commande, en command, et le use case décide, avec les mêmes règles que pour une requête HTTP.

## Exceptions

Aucune. Une migration change la forme des données, jamais leurs faits (PER-12) : elle ne relève pas de cette règle.

## Correction

```txt
src/wallets/driving/
├── in-process/
│   └── expired-holds.scheduler.ts    déclenche ReleaseExpiredHolds à intervalle régulier
└── cli/
    └── block-wallets.cli.ts          lit ses arguments, appelle BlockWallet pour chaque wallet
```

Le scheduler démarre avec l’application, et s’arrête avec elle (WIR-10). La commande en ligne démarre l’application depuis ses vrais modules, sans serveur HTTP, appelle le use case, puis s’arrête.

## Voir aussi

WIR-09 fait passer par des use cases le travail au démarrage. PER-12 tient les faits métier hors des migrations. UC-02 garde le use case indépendant de ce qui l’appelle.
