---
menu: Vue d’ensemble
---

# Traduction et données étrangères

Un bounded context downstream protège son modèle des modèles dont il dépend. Ces règles gardent l’anticorruption layer à un seul endroit, ne traduisent que ce dont le bounded context a besoin, et obligent un bounded context qui copie des données étrangères à prendre en charge leur synchronisation.

## En pratique {#in-practice}

Un fournisseur externe donne des taux de change dans son propre format. Une seule classe transforme sa réponse en un concept du bounded context `wallets` :

```ts
const ProviderQuotes = z.object({
	quotes: z.array(z.object({ pair: z.string(), mid: z.string(), timestamp: z.iso.datetime() })),
});

export class RatesProviderTranslator {
	toLookup(body: unknown, from: string, to: string): RateLookup {
		const quote = ProviderQuotes.parse(body).quotes.find((candidate) => candidate.pair === `${from}${to}`);

		if (!quote) {
			return { found: false };
		}

		const rate = ExchangeRate.of(from, to, quote.mid, new Date(quote.timestamp));

		return rate.ok ? { found: true, rate: rate.value } : { found: false };
	}
}
```

- L’anticorruption layer vit à un seul endroit, à côté de l’adapter du fournisseur : rien d’autre dans le bounded context ne connaît son format (ACL-01).
- Seul le nécessaire est traduit : la paire demandée, son taux et sa date. Le schéma Zod ignore tout le reste de la réponse (ACL-02).
- Une réponse illisible lève une erreur, comme une panne du fournisseur : le modèle ne reçoit jamais une valeur à moitié lue.

## Règles {#rules}

<RuleTable />
