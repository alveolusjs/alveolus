---
menu: Vue d’ensemble
---

# Infrastructure de test

Ces règles disent sur quoi tournent les tests d’intégration et end-to-end. La base est un vrai PostgreSQL, démarré par la suite elle-même et construit par les migrations. Chaque worker a la sienne, vidée avant chaque test. Un système tiers est simulé par des stubs générés depuis son contrat, et une sandbox vérifie chaque nuit que ce contrat tient.

## En pratique {#in-practice}

La base de la suite, mise en place une fois par run :

```ts
// src/shared/__test__/database.global-setup.ts; workers is the maxWorkers of the Vitest config
export async function setup(project: TestProject): Promise<() => Promise<void>> {
	const container = await new PostgreSqlContainer('postgres:18').withDatabase('app_template').start();

	execSync('prisma migrate deploy', { env: { ...process.env, DATABASE_URL: container.getConnectionUri() } });
	project.provide('databaseUrl', container.getConnectionUri());

	for (let worker = 1; worker <= workers; worker++) {
		await admin.$executeRawUnsafe(`CREATE DATABASE test_${worker} TEMPLATE app_template`);
	}

	return async () => {
		await container.stop();
	};
}
```

- Un conteneur par run, démarré par Testcontainers, la même version de PostgreSQL qu’en production (INF-01).
- Le schéma vient des migrations commitées : la base de test les teste aussi (INF-01, PER-10).
- Une copie de la base modèle par worker, vidée avant chaque test : les tests tournent en parallèle sans se voir (INF-02).
- La mise en place est commune à tous les bounded contexts, dans `src/shared/__test__/` (TST-05).
- Le serveur de stubs des systèmes tiers démarre de la même façon, dans `src/shared/__test__/http.setup.ts` (INF-04).

## Règles {#rules}

<RuleTable />
