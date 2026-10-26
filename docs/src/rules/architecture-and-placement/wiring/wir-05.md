---
code: WIR-05
title: Seuls les fichiers de wiring et les adapters du framework connaissent le container
group: Dépendances
scope: [domain, application, driven]
style: [tactical, transaction-script]
severity: major
detection: [oxlint]
review: approved
sources:
  - "Avoid Dependency Injection"
  - "Enterprise Component Containers"
---

# WIR-05 · Seuls les fichiers de wiring et les adapters du framework connaissent le container

<RuleMeta />

## Signal

- `@Injectable()` sur un handler, un repository, un mapper, un domain service ou un translator.
- `@Inject(UnitOfWork)` dans le constructeur d’un repository.
- `@nestjs/common` importé dans `application` pour ses seuls decorators.

## Pourquoi

Le container est un détail de la périphérie. Une classe qui porte ses decorators dépend de NestJS sans qu’aucun de ses comportements n’en ait besoin : on ne peut ni la lire, ni la construire, ni la déplacer sans le framework, et le graphe du bounded context se partage entre le module et cinquante classes.

Une classe ordinaire se construit de la même façon partout : par le module, par un test, par une commande en ligne. Le module liste tout le graphe du bounded context dans un seul fichier.

## Exceptions

Les classes que NestJS crée et pilote lui-même, dans `driving/http` : controllers, guards, pipes, filters, interceptors. Elles portent leurs decorators, et nomment ce qu’elles injectent (WIR-06). La classe du module peut injecter ce qu’utilisent ses hooks de cycle de vie (WIR-09).

## Correction

Retirer les decorators, et construire la classe dans le module avec `construct`, qui liste les injection tokens dans l’ordre du constructeur. Une classe qui reçoit aussi une valeur de la configuration se construit avec `useFactory` (WIR-11).

```ts
// application/wallet/credit-wallet.command.ts
export class CreditWalletHandler extends CommandHandler<CreditWalletCommand, void, CreditWalletError> {
	readonly #unitOfWork: UnitOfWork;
	readonly #wallets: WalletRepository;
	readonly #journal: Journal;
	readonly #outbox: Outbox;
	readonly #clock: Clock;

	constructor(unitOfWork: UnitOfWork, wallets: WalletRepository, journal: Journal, outbox: Outbox, clock: Clock) {
		super();
		this.#unitOfWork = unitOfWork;
		this.#wallets = wallets;
		this.#journal = journal;
		this.#outbox = outbox;
		this.#clock = clock;
	}
}
```

```ts
// wallets.module.ts
construct(CreditWalletHandler, [UnitOfWork, WalletRepository, Journal, Outbox, Clock]),
```

## Adaptation

`construct` est une fonction de wiring de `shared/` (`shared.wiring.ts`), présentée dans la [vue d’ensemble](./#in-practice). Elle transforme une classe et ses injection tokens en factory provider NestJS ; `{ ...construct(Implémentation, tokens), provide: Port }` le lie à un port.

**Notre choix** : aucun decorator NestJS dans `domain`, `application` et `driven`. Le domaine en était déjà libre (LAY-01, AGG-04) ; cette règle étend la même liberté au reste du bounded context.

## Voir aussi

LAY-01 tient tout framework hors du domaine. SRV-01 n’autorise les fonctions libres que dans les fichiers de wiring.
