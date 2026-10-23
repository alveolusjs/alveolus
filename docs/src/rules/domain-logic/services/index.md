---
menu: Vue d’ensemble
---

# Domain services

Un domain service porte une opération métier qui n’appartient à aucun objet du domaine. C’est le pattern le plus facile à mal employer. Un développeur qui découvre le DDD est tenté d’y mettre toute la logique : l’aggregate ne garde que ses données, et le modèle devient anémique (ENT-10). Ces règles disent quand créer un domain service, et surtout quand ne pas le faire.

## Où mettre une règle métier {#where}

Se poser ces questions dans l’ordre, et s’arrêter au premier oui :

1. La règle porte sur l’état d’un seul aggregate ? Une méthode de l’aggregate. `wallet.debit()` vérifie lui-même le statut, les blocages et le solde (AGG-01).
2. La règle porte sur une valeur ? Une méthode du value object. `Money.plus()` refuse deux devises différentes (VO-05).
3. La règle a besoin de plusieurs objets, ou d’une donnée qu’aucun objet ne porte ? Alors, et seulement alors, un domain service (SRV-01).
4. Ce n’est pas une règle, mais une étape : charger, enregistrer, ouvrir la transaction, vérifier les droits ? C’est le travail du use case (SRV-05).

Le domain service arrive en troisième position, jamais en premier.

## Ce qu’un domain service n’est pas {#what-it-is-not}

- **Un service par aggregate.** Un `WalletService` avec `debit`, `credit` et `close` vide le wallet de ses règles (ENT-10).
- **Un use case.** Il n’ouvre pas de transaction, ne vérifie pas les droits et n’écrit pas dans l’outbox (SRV-05).
- **Un application service.** En transaction scripts, l’application service regroupe les use cases d’un concept. Le domain service vit dans `domain` et ne connaît que le modèle.
- **Un fourre-tout technique.** Envoyer un e-mail ou appeler une API externe passe par un port, implémenté dans `driven`.

Un domain service de trop se repère vite : son nom reprend celui d’un aggregate (`WalletService`, `HolderManager`), ses méthodes lisent les champs d’un seul objet avant de décider, et l’aggregate qu’il manipule n’a plus que des getters.

## En pratique {#in-practice}

```ts
// Avoid: the wallet's own rules moved into a service, the wallet only holds data
export class WalletService {
	canDebit(wallet: Wallet, amount: Money): boolean {
		return wallet.status === 'open' && !wallet.balance.isLessThan(amount);
	}
}
```

Ces règles portent sur l’état d’un seul wallet : elles vont dans `wallet.debit()`. Un plafond de retrait, en revanche, est un vrai domain service. Un wallet ne peut pas retirer plus d’un certain montant sur 24 heures glissantes, et il ne porte pas l’historique de ses retraits : la vérification n’appartient à aucun objet.

```ts
export class WithdrawalLimit {
	static readonly #window = 24 * 60 * 60 * 1000;
	readonly #withdrawals: RecentWithdrawals;
	readonly #limit: Money;

	constructor(withdrawals: RecentWithdrawals, limit: Money) {
		this.#withdrawals = withdrawals;
		this.#limit = limit;
	}

	async allows(walletId: WalletId, amount: Money, at: Date): Promise<boolean> {
		if (!amount.sameCurrencyAs(this.#limit)) {
			return false;
		}

		const since = new Date(at.getTime() - WithdrawalLimit.#window);
		const withdrawn = await this.#withdrawals.totalSince(walletId, since);

		return !this.#limit.isLessThan(withdrawn.plus(amount));
	}
}
```

Le use case l’appelle avant de débiter le wallet. Il orchestre, et chaque règle reste à sa place :

```ts
const allowed = await this.#withdrawalLimit.allows(walletId, amount, now);

if (!allowed) {
	return err(new WithdrawalLimitExceeded(walletId));
}

const entry = wallet.debit(reference, amount, to, now);
```

- Il existe parce que l’opération n’appartient à aucun aggregate (SRV-01).
- Sans état, nommé dans le langage : un plafond de retrait (SRV-04).
- Ni transaction ni contrôle d’accès : le use case qui l’appelle ouvre la transaction (SRV-05).
- Il renvoie le minimum utile : autorisé ou non (SRV-07).
- Le total qu’il lit ne peut pas changer dans son dos. Chaque retrait passe par `journal.book()`, qui fait avancer la version du wallet : deux retraits simultanés entrent en conflit (AGG-15, PER-09).

## Règles {#rules}

<RuleTable />
