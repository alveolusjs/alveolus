---
code: WIR-11
title: "La configuration se lit dans un fichier `*.config.ts`, puis passe en valeurs"
group: Configuration
scope: [structure, domain, application, driving, driven]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# WIR-11 · La configuration se lit dans un fichier `*.config.ts`, puis passe en valeurs

<RuleMeta />

## Signal

- `process.env.WITHDRAWAL_LIMIT` lu dans un use case, un domain service ou un adapter.
- La valeur par défaut d’une même variable répétée dans plusieurs fichiers.

## Pourquoi

Un fichier qui lit `process.env` dépend de l’environnement du processus. On ne peut pas le tester avec une autre valeur sans changer cet environnement, et personne ne peut lister ce dont l’application a besoin pour démarrer. Lue à un seul endroit, la configuration est visible, typée et validée une fois, au démarrage.

## Exceptions

Aucune. Un test passe les valeurs dont il a besoin.

## Correction

Chaque bounded context lit sa configuration dans `<context>.config.ts`, l’application dans `app.config.ts`, le wiring technique dans `shared.config.ts`. Une valeur invalide arrête le démarrage. Le module passe les valeurs aux classes qui en ont besoin, par leur constructeur.

```ts
// wallets.config.ts
const env = z
	.object({
		WITHDRAWAL_LIMIT_MINOR: z.coerce.bigint().positive(),
		WITHDRAWAL_LIMIT_CURRENCY: z.string().regex(/^[A-Z]{3}$/),
	})
	.parse(process.env);

export const walletsConfig = {
	withdrawalLimit: moneyOrThrow(env.WITHDRAWAL_LIMIT_MINOR, env.WITHDRAWAL_LIMIT_CURRENCY),
};

// moneyOrThrow: Currency.of, then Money.of, and throws on a refusal: the application does not start
```

```ts
// wallets.module.ts
{
	provide: WithdrawalLimit,
	useFactory: (withdrawals: RecentWithdrawals) => new WithdrawalLimit(withdrawals, walletsConfig.withdrawalLimit),
	inject: [RecentWithdrawals],
}
```

## Voir aussi

SRV-05 tient le domaine à l’écart des questions techniques. WIR-04 fait passer une valeur de la configuration par le constructeur, comme une dépendance.
