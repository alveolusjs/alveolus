---
code: AGG-02
title: Les parties internes ne changent qu’à travers l’aggregate root
group: Encapsulation
scope: [domain]
style: [tactical]
severity: major
detection: []
review: approved
sources:
  - "Using Law of Demeter and Tell, Don't Ask"
---

# AGG-02 · Les parties internes ne changent qu’à travers l’aggregate root

<RuleMeta />

## Signal

- Un getter public renvoie la collection interne elle-même (un tableau, un `Set` ou une `Map` modifiable).
- Une entity interne expose une méthode qui la modifie, et du code hors de l’aggregate root l’appelle.
- Du code extérieur fait `aggregate.items.push(...)` ou `aggregate.items[0].change(...)`.

## Pourquoi

Les parties peuvent être exposées en lecture. Un client ne modifie l’état de l’aggregate que par une méthode métier de l’aggregate root. Sinon, l’aggregate root ne protège plus ses invariants.

## Exceptions

Exposer les parties en lecture seule : une copie, un objet de lecture dédié, des value objects immuables.

## Correction

Renvoyer une copie ou un objet en lecture seule. Modifier les parties par une méthode métier de l’aggregate root, qui leur délègue le travail.

## Adaptation

TypeScript n’a pas de visibilité limitée au module pour cacher les méthodes qui modifient les parties. Les options :

- ne pas exporter la classe de la partie hors du module de l’aggregate ;
- préférer des value objects immuables (AGG-14) ;
- marquer ces méthodes `@internal` et interdire de les appeler hors du dossier par une règle de lint.

Attention : `ReadonlyArray` protège le tableau, pas ses éléments.

## Exemple

```ts
// Avoid: the internal map itself, open to any caller
get blocks(): Map<string, WalletBlock> {
	return this.#blocks;
}
```

```ts
// Preferred: a copy to read, a business method to change
get blocks(): readonly WalletBlock[] {
	return [...this.#blocks.values()];
}

unblock(reference: BlockReference, at: Date): Result<void, BlockNotFound> {
	if (!this.#blocks.delete(reference.value)) {
		return err(new BlockNotFound(this.id, reference));
	}

	this.record<WalletUnblocked>({
		...eventMetadata(at),
		type: 'wallets.wallet.WalletUnblocked',
		walletId: this.id,
		reference,
	});

	return ok();
}
```

Avec la `Map` elle-même, n’importe quel appelant peut faire `wallet.blocks.delete(...)` : le blocage disparaît sans vérification et sans event. La copie ne laisse que `unblock()` pour lever un blocage. Les blocages sont des value objects immuables : la copie suffit à les protéger (AGG-14).
