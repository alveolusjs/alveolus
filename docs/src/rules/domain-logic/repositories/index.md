---
menu: Vue d’ensemble
---

# Repositories

Un repository donne accès à des aggregates entiers, comme une collection. Il existe deux styles :

- le **style orienté collection** imite un `Set`, et a besoin d’un outil qui suit les changements des objets chargés ;
- le **style orienté persistance** exige un `save` explicite après chaque création et chaque changement.

En Node, c’est presque toujours le second (REP-05). Les règles de transaction couvrent aussi un piège courant d’un repository écrit à la main : écrire l’aggregate root et ses parties hors de la transaction de l’application (REP-14).

## En pratique {#in-practice}

Le domaine déclare ce dont il a besoin, dans ses propres termes :

```ts
export abstract class WalletRepository {
	abstract get(id: WalletId): Promise<Wallet | undefined>;
	abstract save(wallet: Wallet): Promise<Result<void, WalletAlreadyOpen>>;
}
```

Un adapter `driven` l’implémente avec Prisma :

```ts
export class PrismaWalletRepository extends WalletRepository {
	readonly #unitOfWork: PrismaUnitOfWork<Prisma.TransactionClient>;
	readonly #mapper = new WalletMapper();

	constructor(unitOfWork: PrismaUnitOfWork<Prisma.TransactionClient>) {
		super();
		this.#unitOfWork = unitOfWork;
	}

	async get(id: WalletId): Promise<Wallet | undefined> {
		const row = await this.#unitOfWork.client().wallet.findUnique({
			where: { id: id.value },
			include: { blocks: true },
		});

		if (!row) {
			return undefined;
		}

		const wallet = this.#mapper.toDomain(row);
		trackVersion(wallet, row.version);

		return wallet;
	}

	async save(wallet: Wallet): Promise<Result<void, WalletAlreadyOpen>> {
		const db = this.#unitOfWork.client();
		const { id, ...data } = this.#mapper.toRow(wallet);

		try {
			await saveVersioned(wallet, {
				insert: (version) => db.wallet.create({ data: { id, ...data, version } }),
				update: (expected, next) =>
					db.wallet.updateMany({ where: { id, version: expected }, data: { ...data, version: next } }),
			});

			await db.walletBlock.deleteMany({ where: { walletId: id } });
			await db.walletBlock.createMany({ data: this.#mapper.toBlockRows(wallet) });
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				return err(new WalletAlreadyOpen(wallet.holder, wallet.balance.currency));
			}

			throw error;
		}

		return ok();
	}
}
```

- Un repository par aggregate root, pour des aggregates entiers, comme un ensemble indexé par identité (REP-01, REP-02, REP-04).
- Les blocages, des value objects rangés dans des lignes enfants, sont chargés avec le wallet et remplacés à chaque enregistrement (REP-02, VO-11).
- L’interface ne parle que le langage du domaine : aucun type Prisma, aucun SQL, et un second wallet dans la même devise revient sous forme de refus, `WalletAlreadyOpen` (REP-03).
- Un mapper reconstruit le wallet par `Wallet.restore`, sans setter (REP-08).
- Le repository n’ouvre pas de transaction : `client()` lui rend celle que le use case a ouverte avec `run()`, portée par AsyncLocalStorage (REP-13, REP-14). Il écrit sous optimistic concurrency, avec la version tenue hors du modèle (AGG-15, AGG-16).

## Règles {#rules}

<RuleTable />
