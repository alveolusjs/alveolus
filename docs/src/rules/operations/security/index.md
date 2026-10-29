---
menu: Vue d’ensemble
---

# Sécurité

Ce qu’une requête apporte, le client l’a choisi. Ce qu’un log ou un message emporte, d’autres le liront. Ces règles gardent les deux frontières : une entrée validée et une identité établie avant le use case, des secrets et des données personnelles qui ne sortent que là où ils servent. L’autorisation d’un use case relève de UC-06.

## En pratique {#in-practice}

Débiter un wallet par HTTP :

```ts
@Post(':id/debits')
@HttpCode(204)
async debit(
	@AuthenticatedCaller() caller: Caller,
	@Param('id', { schema: WalletIdParam }) id: string,
	@Body({ schema: DebitWalletRequest }) body: DebitWalletRequest,
): Promise<void> {
	const debited = await this.#debitWallet.handle({ caller, walletId: id, amount: body.amount });

	this.orHttpError(debited);
}
```

- Le corps et le paramètre ont chacun leur schéma : une entrée invalide est refusée avant le use case (SEC-01).
- L’appelant vient du token vérifié par le guard, jamais du corps de la requête (SEC-02).
- Le use case reçoit l’appelant dans sa command, et vérifie ses droits lui-même (UC-06).

## Règles {#rules}

<RuleTable />
