---
code: INF-02
title: Chaque test part d’une base vide
group: Base jetable
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# INF-02 · Chaque test part d’une base vide

<RuleMeta />

## Signal

- Un test qui trouve les données d’un autre.
- Des tests qui passent seuls et échouent ensemble.
- Des tests sur base lancés en série pour ne pas se gêner.
- Un test enveloppé dans une transaction annulée à la fin.

## Pourquoi

Une ligne laissée par un test fausse le suivant, et deux tests qui écrivent en même temps se faussent l’un l’autre. Une transaction annulée ne convient pas : le Unit of Work valide la sienne (REP-14), et le test ne prouverait ni le commit ni l’outbox.

## Exceptions

Aucune.

## Correction

- Une base par worker, copiée d’une base modèle déjà migrée (INF-01).
- Un `TRUNCATE` des tables des bounded contexts avant chaque test.

## Adaptation

**Notre choix** : le `globalSetup` crée une copie par worker (`CREATE DATABASE test_<n> TEMPLATE app_template`), et chaque worker se branche sur la sienne par `VITEST_POOL_ID`. Un setup file vide les tables :

```ts
// src/shared/__test__/database.setup.ts
beforeEach(async () => {
	const tables = await prisma.$queryRaw<{ name: string }[]>`
		SELECT format('%I.%I', schemaname, tablename) AS name
		FROM pg_tables
		WHERE schemaname IN ('wallets', 'holders')`;

	await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((table) => table.name).join(', ')} RESTART IDENTITY CASCADE`);
});
```

## Voir aussi

INF-01 construit la base modèle. TST-07 rend chaque test indépendant de l’ordre de la suite.
