---
menu: Vue d’ensemble
---

# Entities

Une entity se définit par une identité qui reste stable dans le temps, et par des méthodes métier nommées dans le langage. Ces règles disent quand en créer une, comment l’identifier, comment elle porte un comportement au lieu d’exposer des données, et comment la construire et la valider.

Plusieurs d’entre elles complètent AGG-05 (l’identité de l’aggregate root). La section Voir aussi le signale à chaque fois.

## En pratique {#in-practice}

Un titulaire de wallet est une entity : il garde son identité pendant que son statut change.

```ts
export type HolderSnapshot = { readonly id: string; readonly status: HolderStatus };

export class Holder extends AggregateRoot<HolderId, HolderClosed, HolderSnapshot> {
	#status: HolderStatus;

	private constructor(id: HolderId, status: HolderStatus) {
		super(id);
		this.#status = status;
	}

	static restore(id: HolderId, status: HolderStatus): Holder {
		return new Holder(id, status);
	}

	isActive(): boolean {
		return this.#status === 'active';
	}

	toSnapshot(): HolderSnapshot {
		return { id: this.id.value, status: this.#status };
	}

	close(at: Date): Result<void, HolderIsClosed> {
		if (this.#status === 'closed') {
			return err(new HolderIsClosed(this.id));
		}

		this.#status = 'closed';
		this.record<HolderClosed>({ ...eventMetadata(at), type: 'wallets.holder.HolderClosed', holderId: this.id });

		return ok();
	}
}
```

- L’identité est un value object typé, et ne change jamais (ENT-03, ENT-06).
- Du comportement, pas des données : `close` et `isActive` sont nommés dans le langage, et il n’y a aucun setter (ENT-10, ENT-11).
- Une intention, une méthode, un event : fermer enregistre `HolderClosed` (ENT-12).
- La déclaration dit tout de l’aggregate : son identité, ses events et le snapshot que le repository enregistre (REP-08).

## Règles {#rules}

<RuleTable />
