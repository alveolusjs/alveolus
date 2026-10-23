---
menu: Vue d’ensemble
---

# API HTTP

L’API HTTP est un adapter driving. Ces règles gardent le modèle derrière elle : des représentations taillées pour le client, et une sémantique HTTP respectée. Ce qu’un écran lit relève de [Use cases](../use-cases/) (UC-09, UC-10).

## En pratique {#in-practice}

Bloquer les débits d’un wallet par HTTP :

```ts
// driving/http/wallet.controller.ts
@Controller('wallets')
export class WalletController extends ResultController {
	readonly #blockWallet: BlockWalletHandler;

	constructor(@Inject(BlockWalletHandler) blockWallet: BlockWalletHandler) {
		super();
		this.#blockWallet = blockWallet;
	}

	@Post(':id/blocks')
	@HttpCode(204)
	async block(
		@Param('id', { schema: WalletIdParam }) id: string,
		@Body({ schema: BlockWalletRequest }) body: BlockWalletRequest,
	): Promise<void> {
		const blocked = await this.#blockWallet.handle({
			walletId: id,
			reference: body.reference,
			directions: body.directions,
		});

		this.orHttpError(blocked);
	}
}
```

La requête a son propre schéma, distinct du modèle du domaine :

```ts
// driving/http/block-wallet.request.ts
export const BlockWalletRequest = z
	.object({
		reference: z.string().min(1).max(64).meta({ example: 'fraud-review-2026-0142' }),
		directions: z
			.array(z.enum(['debits', 'credits']))
			.min(1)
			.meta({ example: ['debits'] }),
	})
	.meta({ id: 'BlockWallet' });

export type BlockWalletRequest = z.output<typeof BlockWalletRequest>;

export const WalletIdParam = z.uuid();
```

- L’API reçoit une requête et la traduit en command : le wallet lui-même ne sort jamais du domaine (API-01).
- Sémantique HTTP : bloquer un wallet change son état, c’est donc un `POST` sur ses blocages, jamais un `GET`. Il ne renvoie rien, d’où le `204`. Un refus du modèle devient `400`, `404`, `409` ou `422` par `ResultController`, la classe de base des controllers (API-02).
- La référence vient du client : rejouée, la même requête ne bloque pas deux fois le wallet, et une référence déjà prise pour un autre blocage revient en `409`.

## Règles {#rules}

<RuleTable />
