---
code: INF-05
title: Un test de contrat vérifie les champs consommés
group: Systèmes tiers
scope: [driven, tests]
style: [tactical, transaction-script]
severity: minor
severityNote: Majeure pour des identifiants de la sandbox commités.
detection: []
review: approved
sources: []
---

# INF-05 · Un test de contrat vérifie les champs consommés

<RuleMeta />

## Signal

- Un test de contrat qui ne vérifie que le statut `200`.
- Une réponse de la sandbox jamais comparée au contrat commité.
- Un test de contrat dans la suite de chaque MR : elle échoue quand la sandbox tombe.
- Des identifiants de la sandbox écrits dans le code ou dans la configuration commitée.

## Pourquoi

Les stubs ne prouvent que ce que le contrat déclare. Le test de contrat vérifie que la sandbox répond toujours ainsi. Un contrat déclare souvent ses champs facultatifs : une réponse sans le champ que l’adapter lit reste valide, d’où une assertion par champ consommé.

## Exceptions

Aucune.

## Correction

- Le test appelle la sandbox comme l’adapter, et valide la réponse contre le schéma du contrat commité.
- Il vérifie, un par un, les champs que le translator lit.
- Il valide aussi les réponses enregistrées (INF-03) contre le contrat, ou contre le schéma du translator quand le provider n’en publie pas.
- Il tourne chaque nuit et sur la MR de montée de version, jamais dans la suite des autres MR. Un échec ouvre un ticket.
- Les identifiants de la sandbox sont des variables masquées de la CI.

## Adaptation

**Notre choix** : Ajv valide la réponse contre le schéma du contrat, et un projet Vitest `contract` lance les `*.contract-spec.ts`. La sandbox peut être en avance sur la production : un champ qu’elle ajoute ne se consomme qu’une fois dans une version publiée du contrat.

## Voir aussi

INF-03 fige le contrat que ce test vérifie. TST-01 garde la sandbox hors de la suite des MR.

## Exemple

```ts
// src/wallets/driven/http/rates-provider/__test__/http-exchange-rates.contract-spec.ts
it('answers a quote that the translator can read', async () => {
	// Arrange
	const matchesContract = contract.response('GET /quotes', 200);

	// Act
	const response = await fetch(new URL('quotes?pairs=EURUSD', sandbox.url), { headers: sandbox.headers });
	const body: unknown = await response.json();

	// Assert
	expect(matchesContract(body)).toBe(true);
	expect(body).toMatchObject({ quotes: [{ pair: 'EURUSD', mid: expect.any(String), timestamp: expect.any(String) }] });
});
```
