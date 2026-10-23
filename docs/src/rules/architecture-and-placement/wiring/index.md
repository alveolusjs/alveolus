---
menu: Vue d’ensemble
---

# Wiring

Il faut bien choisir quelle implémentation sert chaque port, et construire les objets dans le bon ordre. Ces règles placent ce choix à un seul endroit par bounded context, son module, et le tiennent hors de tout le reste : les classes reçoivent ce dont elles ont besoin par leur constructeur, nomment ce qu’elles injectent, ne gardent aucun état d’une requête, et ne demandent jamais rien au container. La configuration se lit une fois, dans son propre fichier, et passe en valeurs. Le modèle ne connaît pas le framework, et la plupart du code qui l’entoure non plus.

La place du module relève de [Ce qui va où](../placement/) (PLC-01). La façon dont le domaine déclare ses ports relève de LAY-01. Le démarrage de l’application dans les tests relève de [Tests](../tests/) (TST-03).

## En pratique {#in-practice}

Le bounded context `wallets` d’une application de wallet. Chaque classe est une classe ordinaire ; le module les construit toutes.

Le module construit chaque classe avec `construct`, une fonction de wiring de `shared/` : elle prend la classe et ses injection tokens, dans l’ordre du constructeur, et renvoie un provider NestJS. `{ ...construct(Implémentation, tokens), provide: Port }` lie l’implémentation au port. Chaque token est une classe, son propre injection token (WIR-07), et le compilateur vérifie qu’il produit le type attendu à sa place : deux tokens inversés ne compilent pas.

```ts
// shared/shared.wiring.ts
type Tokens<Args extends unknown[]> = { [K in keyof Args]: abstract new (...args: never[]) => Args[K] };

export function construct<T, Args extends unknown[]>(
	type: new (...args: Args) => T,
	tokens: Tokens<Args>,
): FactoryProvider<T> {
	return { provide: type, useFactory: (...args: Args) => new type(...args), inject: tokens };
}
```

```ts
// wallets.module.ts
@Module({
	controllers: [WalletController],
	providers: [
		{ ...construct(PrismaWalletRepository, [PrismaUnitOfWork]), provide: WalletRepository },
		{ ...construct(PrismaJournal, [PrismaUnitOfWork]), provide: Journal },
		{ ...construct(PrismaWalletViews, [PrismaClient]), provide: WalletViews },
		construct(DebitWalletHandler, [UnitOfWork, WalletRepository, Journal, Outbox, Clock]),
		construct(CreditWalletHandler, [UnitOfWork, WalletRepository, Journal, Outbox, Clock]),
		construct(GetWalletHandler, [WalletViews]),
		{ ...construct(WalletsFacadeAdapter, [CreditWalletHandler, GetWalletHandler]), provide: WalletsFacade },
	],
	exports: [WalletsFacade],
})
export class WalletsModule {}
```

```ts
// application/wallet/debit-wallet.command.ts
export class DebitWalletHandler extends CommandHandler<DebitWalletCommand, void, DebitWalletError> {
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

	// handle(command): load the wallet, let it create the entry, book it, as in the aggregates overview
}
```

```ts
// driving/http/wallet.controller.ts
@Controller('wallets')
export class WalletController extends ResultController {
	readonly #debitWallet: DebitWalletHandler;
	readonly #getWallet: GetWalletHandler;

	constructor(
		@Inject(DebitWalletHandler) debitWallet: DebitWalletHandler,
		@Inject(GetWalletHandler) getWallet: GetWalletHandler,
	) {
		super();
		this.#debitWallet = debitWallet;
		this.#getWallet = getWallet;
	}
}
```

- Le module du bounded context lie chaque port à son implémentation, et n’exporte que la facade de `public` (WIR-01, WIR-03).
- `app.module.ts` importe les modules des bounded contexts, `main.bootstrap.ts` démarre l’application (WIR-02).
- Le handler reçoit ses dépendances par son constructeur, et ne sait rien de NestJS : ni `@Injectable`, ni `@Inject` (WIR-04, WIR-05).
- `construct` et `@Inject` nomment chaque injection token ; `WalletRepository` est une abstract class, et son propre injection token (WIR-06, WIR-07).
- Le handler ne garde aucun champ par requête : la transaction circule par le Unit of Work (WIR-08).
- Le travail au démarrage passe par des use cases, et l’application ferme ce qu’elle a ouvert (WIR-09, WIR-10).

## Règles {#rules}

<RuleTable />
