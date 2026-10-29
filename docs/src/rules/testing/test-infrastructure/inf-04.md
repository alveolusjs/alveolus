---
code: INF-04
title: Un parcours critique a ses stubs écrits à la main
group: Systèmes tiers
scope: [driven, tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# INF-04 · Un parcours critique a ses stubs écrits à la main

<RuleMeta />

## Signal

- Un parcours en plusieurs appels testé contre les seuls stubs générés : la création répond, la lecture qui suit ne la trouve pas.
- Aucun test de l’adapter face à une erreur ou un timeout du provider.
- Un stub forcé pour un test, qui reste en place pour les suivants.
- Un état de stub laissé par un test, que le suivant retrouve.

## Pourquoi

Les stubs générés sont sans état, et ne répondent que le succès. Un parcours qui crée puis relit a besoin d’un stub qui se souvient. Les pannes se forcent une à une : c’est là que l’adapter se trompe le plus souvent (PRC-01).

## Exceptions

Aucune.

## Correction

- Les parcours qui comptent ont des stubs écrits à la main, avec un état en mémoire, typés par les types générés du contrat.
- Ils passent avant les stubs générés.
- Une erreur ou un timeout se force dans le test qui le prouve.
- L’état et les stubs forcés se remettent à zéro après chaque test.

## Adaptation

`server.use(...)` ajoute un stub en tête, pour le test en cours. `server.resetHandlers()` le retire dans `afterEach`. `HttpResponse.error()` simule une coupure du réseau, et `delay('infinite')` un provider qui ne répond plus.

## Voir aussi

INF-03 génère les autres stubs depuis le contrat. INF-02 remet la base à zéro de la même façon.

## Exemple

```ts
// src/wallets/driven/http/rates-provider/__test__/rates-provider.stubs.ts
type Quote = components['schemas']['Quote'];

export class RatesProviderJourneys {
	readonly #quotes = new Map<string, Quote>();

	readonly stubs = [
		http.post<never, Omit<Quote, 'id'>>('*/quotes', async ({ request }) => {
			const quote: Quote = { ...(await request.json()), id: `quote-${this.#quotes.size + 1}` };
			this.#quotes.set(quote.id, quote);

			return HttpResponse.json(quote, { status: 201 });
		}),
		http.get<{ id: string }>('*/quotes/:id', ({ params }) => {
			const quote = this.#quotes.get(params.id);

			if (!quote) {
				return new HttpResponse(null, { status: 404 });
			}

			return HttpResponse.json(quote);
		}),
	];

	reset(): void {
		this.#quotes.clear();
	}
}
```

```ts
// src/shared/__test__/http.setup.ts
const journeys = new RatesProviderJourneys();
export const server = setupServer(...journeys.stubs, ...ratesProviderStubs);

beforeAll(() => {
	server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
	server.resetHandlers();
	journeys.reset();
});

afterAll(() => {
	server.close();
});
```
