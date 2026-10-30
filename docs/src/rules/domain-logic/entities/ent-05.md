---
code: ENT-05
title: L’identité est générée tôt quand elle sert avant la persistance
group: Identité
scope: [domain, driven]
style: [tactical]
severity: blocking
detection: []
review: approved
sources:
  - "Unique Identity › Persistence Mechanism Generates Identity (sidebar 'Order May Matter')"
  - "When the Timing of Identity Generation Matters"
---

# ENT-05 · L’identité est générée tôt quand elle sert avant la persistance

<RuleMeta />

## Signal

L’identité du domaine est attribuée par la base à l’insertion (auto-incrément, colonne générée par l’ORM), alors que :

- l’entity publie un event dès sa création ;
- ou de nouvelles entities sont comparées ou rangées par identité (`Set`, `Map`) avant d’être enregistrées.

## Pourquoi

Avec une génération tardive, l’event de création part sans identité valide. Les nouvelles entities sans identité (`null`, `0`, `-1`) semblent aussi toutes égales. Une collection n’en garde alors qu’une, un bug difficile à retrouver.

## Exceptions

La génération tardive convient quand personne n’a besoin de l’identité avant l’insertion.

## Correction

Obtenir l’identité avant de construire l’entity, et la passer à la factory method : l’entity et son event de création portent l’identité dès le départ. Une identité qui vient de la base (une séquence lue à l’avance) est fournie par le repository.

Pour le bug des collections, une égalité sur d’autres attributs est aussi acceptable, mais la génération précoce reste préférable.

## Adaptation

**Notre choix** : le repository de l’aggregate donne l’identité suivante, par `nextIdentity()`. Ce n’est pas une méthode de `CommandRepository` : une identité reçue d’un autre bounded context ne se génère pas. Elle renvoie une `Promise`, pour qu’une séquence de la base reste possible.

Pour un nouvel aggregate, l’identité est un UUIDv7, généré par l’application. Le port `IdGenerator` de `@alveolus/core` est implémenté une fois dans `shared/driven`, avec la bibliothèque `uuid`, et le repository le passe à `generate` de la classe d’identité (ENT-03). Le domaine ne génère rien lui-même : l’aléatoire et l’heure restent dans `driven`. Les UUIDv7 n’ont pas besoin de la base, et ils sont ordonnés dans le temps : ils conviennent aux index B-tree, contrairement aux UUIDv4.

Seul le repository sait comment son aggregate obtient une identité. Un aggregate plus ancien garde sa séquence ou ses UUIDv4, sans que le domaine change.

## Exemple

```ts
// Avoid: the id only exists after the insert, the event goes out without it
const transfer = Transfer.draft(ownerId, amount, at); // records TransferDrafted with an undefined id
await this.#transfers.save(transfer);
```

```ts
// Preferred: the repository gives the identity before construction
const transfer = Transfer.draft(await this.#transfers.nextIdentity(), ownerId, amount, at);

return this.#transfers.save(transfer);
```

```ts
export abstract class TransferRepository extends CommandRepository<Transfer, DuplicateTransfer> {
	abstract nextIdentity(): Promise<TransferId>;
}
```

```ts
export class PrismaTransferRepository extends TransferRepository {
	readonly #ids: IdGenerator;

	// constructor and the methods of CommandRepository left out

	nextIdentity(): Promise<TransferId> {
		return Promise.resolve(TransferId.generate(this.#ids));
	}
}
```

```ts
export class UuidV7Generator extends IdGenerator {
	next(): string {
		return v7();
	}
}
```

`draft` reçoit l’identité et l’enregistre dans `TransferDrafted` : l’event de création porte une identité valide.
