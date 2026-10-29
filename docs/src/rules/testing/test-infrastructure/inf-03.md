---
code: INF-03
title: Un système tiers se simule depuis son contrat
group: Systèmes tiers
scope: [driven, tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# INF-03 · Un système tiers se simule depuis son contrat

<RuleMeta />

## Signal

- Des réponses de provider écrites à la main, alors qu’il publie un contrat OpenAPI.
- Un contrat lu sur le réseau pendant un test ou un build, ou pris sur sa dernière version.
- Un contrat retouché à la main, ou qui change hors d’une MR de montée de version.
- Une requête qu’aucun stub ne reconnaît, et qui ne fait pas échouer le test.
- Une opération sans exemple, dont le stub généré répond des valeurs qui changent à chaque run.

## Pourquoi

Un stub écrit à la main décrit l’API telle qu’on la croit. Généré depuis le contrat du provider, il suit ce que l’API déclare, comme les types du client. Figé et commité, le contrat donne les mêmes stubs à chaque run, et une nouvelle version arrive par une MR qui montre ce qu’elle casse.

## Exceptions

Un provider qui ne publie aucun contrat : ses stubs servent des réponses enregistrées, et le schéma du translator tient lieu de contrat. INF-05 les vérifie.

## Correction

- Le contrat est téléchargé depuis une version publiée du provider, puis commité à côté de l’adapter : `<upstream>.openapi.json`.
- Il est la seule source des types du client (PLC-11), des stubs et des tests de contrat (INF-05).
- Les stubs répondent les exemples du contrat, jamais des valeurs tirées au hasard (TST-07).
- Une opération sans exemple répond une réponse enregistrée : une vraie réponse de la sandbox, sans identifiant ni donnée personnelle, commitée dans `__test__/recordings/`. Elle se réenregistre à chaque montée de version.
- Une requête qu’aucun stub ne reconnaît fait échouer le test.
- Une nouvelle version passe par une MR de montée de version, qui montre les breaking changes. On y lit les notes de version du provider.

## Adaptation

**Notre choix** : MSW (`setupServer` de `msw/node`, avec `onUnhandledRequest: 'error'`), les stubs générés par `fromOpenApi` de `@msw/source`. MSW intercepte la requête une fois que l’adapter l’a construite : l’URL, les paramètres, le timeout et la lecture de la réponse restent ceux de la production. Un script télécharge le contrat, converti en OpenAPI 3 s’il est en Swagger 2.0. La CI le relance et échoue si le fichier commité diffère (`git diff --exit-code`). `oasdiff breaking` liste les breaking changes de la MR de montée de version. Sans `example`, `fromOpenApi` tire des valeurs du schéma, différentes à chaque run : un stub écrit à la main sert alors l’enregistrement, avant les stubs générés.

## Voir aussi

INF-04 écrit à la main les parcours que les stubs générés ne savent pas jouer. ACL-01 garde les types générés dans l’anticorruption layer.

## Exemple

Le contrat commité porte l’exemple de chaque réponse :

```json
"200": {
	"content": {
		"application/json": {
			"schema": { "$ref": "#/components/schemas/Quotes" },
			"example": { "quotes": [{ "pair": "EURUSD", "mid": "1.0842", "timestamp": "2026-03-31T12:00:00Z" }] }
		}
	}
}
```

Les stubs sont générés depuis lui :

```ts
// src/wallets/driven/http/rates-provider/__test__/rates-provider.stubs.ts
import { fromOpenApi } from '@msw/source/open-api';

import contract from '../rates-provider.openapi.json' with { type: 'json' };

export const ratesProviderStubs = await fromOpenApi(contract);
```

Si le contrat ne donne pas d’exemple pour `GET /quotes`, l’enregistrement passe avant les stubs générés :

```ts
// src/wallets/driven/http/rates-provider/__test__/rates-provider.stubs.ts
import getQuotes from './recordings/get-quotes.200.json' with { type: 'json' };

export const ratesProviderStubs = [
	http.get('*/quotes', () => HttpResponse.json(getQuotes)),
	...(await fromOpenApi(contract)),
];
```

Un setup file démarre le serveur pour chaque fichier de test, et le projet `integration` de Vitest le charge :

```ts
// src/shared/__test__/http.setup.ts
export const server = setupServer(...ratesProviderStubs);

beforeAll(() => {
	server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});
```

```ts
// vitest.config.ts
{
	test: {
		name: 'integration',
		include: ['src/**/*.integration-spec.ts', 'src/**/*.e2e-spec.ts'],
		globalSetup: ['src/shared/__test__/database.global-setup.ts'],
		setupFiles: ['src/shared/__test__/database.setup.ts', 'src/shared/__test__/http.setup.ts'],
	},
},
```

Le test construit le vrai adapter, sur l’adresse de production : MSW répond l’exemple du contrat, et toute autre requête fait échouer le test.

```ts
// src/wallets/driven/http/rates-provider/__test__/http-exchange-rates.integration-spec.ts
describe('HttpExchangeRates', () => {
	it('finds the rate of a pair that the provider quotes', async () => {
		// Arrange
		const rates = new HttpExchangeRates(new URL('https://rates.example/'), new RatesProviderTranslator());
		const quoted = anExchangeRate('EUR', 'USD', '1.0842', '2026-03-31T12:00:00Z');

		// Act
		const lookup = await rates.current('EUR', 'USD');

		// Assert
		expect(lookup.found ? lookup.rate.equals(quoted) : undefined).toBe(true);
	});

	it('finds no rate when the provider answers 503', async () => {
		// Arrange
		server.use(http.get('*/quotes', () => new HttpResponse(null, { status: 503 })));
		const rates = new HttpExchangeRates(new URL('https://rates.example/'), new RatesProviderTranslator());

		// Act
		const lookup = await rates.current('EUR', 'USD');

		// Assert
		expect(lookup).toEqual({ found: false });
	});
});
```
