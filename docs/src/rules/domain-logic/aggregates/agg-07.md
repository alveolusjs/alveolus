---
code: AGG-07
title: Un aggregate reçu en paramètre est en lecture seule
group: Transactions et cohérence
scope: [domain]
style: [tactical]
severity: major
detection: LLM
review: approved
sources:
  - "Model Navigation"
---

# AGG-07 · Un aggregate reçu en paramètre est en lecture seule

<RuleMeta />

## Signal

Une méthode métier d’un aggregate reçoit un autre aggregate en paramètre et appelle une méthode qui le modifie.

## Pourquoi

C’est AGG-06 caché dans le domaine. Avoir accès à plusieurs aggregates dans un use case ne donne pas le droit d’en modifier plusieurs.

## Exceptions

Aucune. Lire l’autre aggregate pour vérifier une condition est normal.

## Correction

L’aggregate appelé enregistre un domain event, et un handler modifie l’autre aggregate dans sa propre transaction (AGG-08). Si la cohérence doit être immédiate, revoir la frontière (AGG-10, AGG-11).

## Exemple

```ts
// Avoid: suspending the holder also blocks the wallet it receives
suspend(
	wallet: Wallet,
	reference: BlockReference,
	at: Date,
): Result<void, HolderIsSuspended | WalletIsClosed | BlockConflict> {
	if (this.#status === 'suspended') {
		return err(new HolderIsSuspended(this.id));
	}

	const blocked = wallet.block(reference, ['debits'], at);

	if (!blocked.ok) {
		return blocked;
	}

	this.#status = 'suspended';

	return ok();
}
```

```ts
// Preferred: the holder records its suspension, and only changes itself
suspend(at: Date): Result<void, HolderIsSuspended> {
	if (this.#status === 'suspended') {
		return err(new HolderIsSuspended(this.id));
	}

	this.#status = 'suspended';
	this.record<HolderSuspended>({
		...eventMetadata(at),
		type: 'wallets.holder.HolderSuspended',
		holderId: this.id,
	});

	return ok();
}
```

Un handler de `HolderSuspended` bloque ensuite les débits de chaque wallet du titulaire, chacun dans sa propre transaction (AGG-08). Le blocage porte une référence : si l’event est traité deux fois, le wallet retrouve le même blocage et ne change rien.
