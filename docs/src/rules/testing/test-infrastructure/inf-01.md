---
code: INF-01
title: Les tests tournent sur une base jetable
group: Base jetable
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# INF-01 · Les tests tournent sur une base jetable

<RuleMeta />

## Signal

- Des tests qui pointent sur la base de développement, ou sur une base partagée.
- Un schéma de test créé par `prisma db push`, ou par un script écrit pour les tests.
- Une suite qui ne passe qu’après avoir lancé une base à la main.

## Pourquoi

Une base partagée garde ce que d’autres y ont laissé : le test passe ou échoue selon eux. Un schéma construit autrement que par les migrations n’est pas celui de la production : une migration cassée passe les tests et échoue au déploiement.

## Exceptions

Aucune.

## Correction

- La suite démarre sa base, une fois par run, et l’arrête à la fin.
- Le schéma vient des migrations commitées (PER-10), sur la version de PostgreSQL de la production.

## Adaptation

**Notre choix** : Testcontainers, depuis le `globalSetup` de Vitest, dans `src/shared/__test__/` (TST-05). Docker est la seule chose à installer.

```ts
// src/shared/__test__/database.global-setup.ts
export async function setup(project: TestProject): Promise<() => Promise<void>> {
	const container = await new PostgreSqlContainer('postgres:18').withDatabase('app_template').start();

	execSync('prisma migrate deploy', { env: { ...process.env, DATABASE_URL: container.getConnectionUri() } });
	project.provide('databaseUrl', container.getConnectionUri());

	return async () => {
		await container.stop();
	};
}
```

## Voir aussi

TST-01 fait tourner le vrai adapter. INF-02 isole chaque test.
