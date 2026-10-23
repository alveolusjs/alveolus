---
code: WIR-04
title: Une classe reçoit ses dépendances par son constructeur
group: Dépendances
scope: [domain, application, driving, driven]
style: [tactical, transaction-script]
severity: major
detection: hybrid
detectionNote: "Un contrôle peut signaler `ModuleRef` et une instance créée au niveau d’un module hors des fichiers de wiring ; la revue trouve les autres recherches cachées."
review: approved
sources:
  - "Is Separated Interface a Necessity?"
  - "Infrastructure"
  - "Enterprise Component Containers"
---

# WIR-04 · Une classe reçoit ses dépendances par son constructeur

<RuleMeta />

## Signal

- Un registre ou un service locator : `Registry.wallets().get(id)`.
- `this.moduleRef.get(WalletRepository)` dans un handler.
- Un collaborateur créé dans une méthode : `new HttpExchangeRates()` dans un domain service.
- Une instance partagée par un import : `export const prisma = new PrismaClient()`, puis `import { prisma }`.
- Une dépendance affectée après la construction : `handler.wallets = repository`.

## Pourquoi

Le constructeur est la liste de ce dont une classe a besoin. Le module le lit pour construire la classe, un test le lit pour la construire avec `new`, un relecteur le lit pour voir ce que la classe peut toucher. Une recherche cachée dans une méthode échappe aux trois : elle échoue à la première requête au lieu du démarrage, et la classe peut atteindre tout ce que le container contient.

## Exceptions

- Ce qui se crée pour un seul appel : value objects, events, erreurs.
- Ce qui change d’un appel à l’autre est un paramètre de la méthode, pas du constructeur : un domain service passé à une méthode de l’aggregate (AGG-04), l’auteur d’une command (UC-06).

## Correction

```ts
export class WithdrawalLimit {
	readonly #withdrawals: RecentWithdrawals;
	readonly #limit: Money;

	constructor(withdrawals: RecentWithdrawals, limit: Money) {
		this.#withdrawals = withdrawals;
		this.#limit = limit;
	}
}
```

Le module passe les implémentations (WIR-01). Une valeur de la configuration passe de la même façon, comme une valeur : ici, le plafond (WIR-11).

## Voir aussi

AGG-04 tient les repositories et les services hors de l’aggregate. UC-05 : un handler ne reçoit pas un autre handler.
