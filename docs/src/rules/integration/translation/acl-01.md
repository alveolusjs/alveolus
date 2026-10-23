---
code: ACL-01
title: L’anticorruption layer vit à un seul endroit
group: Anticorruption layer
scope: [driven, domain]
style: [tactical, transaction-script]
severity: major
detection: hybrid
detectionNote: Des types de l’upstream importés hors de leur dossier `driven/<technology>/<upstream>`.
review: approved
sources:
  - "Anticorruption Layer (definition)"
  - "Projects and Organizational Relationships (choix de SaaSOvation)"
  - "Mapping the Three Contexts › Integration with the Identity and Access Context (Figure 3.9)"
---

# ACL-01 · L’anticorruption layer vit à un seul endroit

<RuleMeta />

## Signal

- Du code downstream qui utilise les représentations de l’upstream (DTO, JSON, types générés) hors de l’anticorruption layer.
- Le même concept traduit dans plusieurs handlers.
- Un adapter qui renvoie les types de l’upstream au lieu de concepts locaux.

## Pourquoi

L’anticorruption layer offre les fonctions de l’upstream dans les termes du modèle local. Elle sert même face à un upstream propre, qui offre un open host service et un published language : la traduction est seulement plus légère.

Elle a trois parties :

- un port côté downstream, dans les termes du modèle local : `ExchangeRates` ;
- un adapter, client de l’upstream, qui implémente le port ;
- un translator, qui produit le concept local : `ExchangeRate`.

## Exceptions

Une relation conformist, choisie et déclarée sur la context map. Ce n’est pas toujours un mauvais choix.

## Correction

Un port par intégration dans `domain`, ou dans `application` dans un bounded context en transaction scripts (TXS-05). Dans `driven/<technology>/<upstream>`, par exemple `driven/http/rates-provider/` : l’adapter qui appelle l’upstream et implémente le port, et le translator vers les concepts locaux.

## Voir aussi

CTX-05 exige un concept local à la frontière. CTX-06 interdit les types de tiers dans le domaine. ACL-01 fixe la structure qui produit ces concepts.

## Exemple

```txt
domain/exchange-rate/
└── exchange-rates.port.ts                 ExchangeRates
driven/http/rates-provider/
├── rates-provider.translator.ts           RatesProviderTranslator
└── http-exchange-rates.adapter.ts         HttpExchangeRates
```

```ts
export abstract class ExchangeRates {
	abstract current(from: string, to: string): Promise<RateLookup>;
}

export class HttpExchangeRates extends ExchangeRates {
	readonly #endpoint: URL;
	readonly #translator: RatesProviderTranslator;

	constructor(endpoint: URL, translator: RatesProviderTranslator) {
		super();
		this.#endpoint = endpoint;
		this.#translator = translator;
	}

	async current(from: string, to: string): Promise<RateLookup> {
		const url = new URL(`quotes?pairs=${from}${to}`, this.#endpoint);
		const response = await fetch(url, { signal: AbortSignal.timeout(2_000) }).catch(() => undefined);

		if (!response?.ok) {
			return { found: false };
		}

		return this.#translator.toLookup(await response.json(), from, to);
	}
}
```

Le domaine ne voit que `ExchangeRates` et `ExchangeRate`. Le format du fournisseur ne sort pas de `driven/http/rates-provider/`.
