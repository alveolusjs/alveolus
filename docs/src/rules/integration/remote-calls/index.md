---
menu: Vue d’ensemble
---

# Appels distants et processus

Un appel distant peut échouer, attendre, ou répondre en retard. Ces règles gardent les appels distants explicites et rares, modélisent ce qui n’est pas encore disponible, rendent explicites les processus qui traversent plusieurs bounded contexts, et empêchent une couche de composition de devenir un modèle caché.

## En pratique {#in-practice}

Le bounded context `wallets` demande un taux de change à un fournisseur externe. L’adapter fait l’appel :

```ts
export class HttpExchangeRates extends ExchangeRates {
	// ...

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

Le use case décide quoi faire sans taux :

```ts
const lookup = await this.#rates.current(command.from, command.to);

if (!lookup.found) {
	return err(new RateUnavailable(command.from, command.to));
}
```

- Un appel distant n’est pas un appel local : il a un timeout, ici deux secondes, et une panne du réseau ou un fournisseur qui ne répond pas donne le même résultat, pas de taux (PRC-01).
- L’absence de taux n’est pas une exception : le port renvoie `found: false`, et le use case la transforme en un refus explicite (PRC-03).

## Règles {#rules}

<RuleTable />
