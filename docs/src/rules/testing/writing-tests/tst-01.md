---
code: TST-01
title: Un test passe par le vrai adapter
group: Principes
scope: [application, driven, tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources:
  - "Interviewing the Successful CIO"
  - "Hexagonal or Ports and Adapters"
---

# TST-01 · Un test passe par le vrai adapter

<RuleMeta />

## Signal

- Un mock de l’ORM, d’un SDK ou d’une librairie HTTP : `vi.mock('@prisma/client')`, un `fetch` remplacé par `vi.fn()`.
- Un repository in-memory, ou une autre base que celle de la production (SQLite, pg-mem).
- Une suite de MR qui appelle la sandbox d’un provider.
- Un test du domaine qui démarre une base de données.

## Pourquoi

Un mock de librairie prouve le mock : il passe quand la requête est fausse. Un repository in-memory ignore les transactions et les contraintes, précisément ce qu’il faut prouver. Une sandbox est lente, parfois hors service, et ne renvoie jamais une panne à la demande. Le domaine, lui, n’a besoin d’aucune infrastructure.

## Exceptions

Un test de panne, dans `__test__/failures/`, peut remplacer un seul port par un double qui échoue, quand la vraie infrastructure ne sait pas produire la panne (TST-03).

## Correction

| L’adapter appelle | Dans la suite de la MR |
| --- | --- |
| Notre base, notre broker | Le vrai logiciel, dans un conteneur (INF-01) |
| Un service cloud à nous : fichiers, email | Un serveur qui parle son protocole : MinIO, Mailpit |
| Un système tiers | Des stubs générés depuis son contrat, qui interceptent la requête de l’adapter, erreurs et timeouts compris (INF-03, INF-04) |

Des tests de contrat vérifient, hors de la MR, que la sandbox du provider répond toujours ainsi (INF-05).

## Adaptation

**Notre choix** : pas de test double in-memory. PostgreSQL tourne dans Testcontainers, et MSW simule un système tiers depuis son contrat (INF-03). Les tests de contrat (`*.contract-spec.ts`) tournent chaque nuit, sans bloquer les MR (INF-05).

## Voir aussi

TST-03 démarre les tests depuis les vrais modules. PRC-01 dit quelles pannes d’un appel distant tester.

## Exemple

```ts
it('finds no rate when the provider answers 503', async () => {
	// Arrange
	server.use(http.get('*/quotes', () => new HttpResponse(null, { status: 503 })));
	const rates = new HttpExchangeRates(new URL('https://rates.example/'), new RatesProviderTranslator());

	// Act
	const lookup = await rates.current('EUR', 'USD');

	// Assert
	expect(lookup).toEqual({ found: false });
});
```
