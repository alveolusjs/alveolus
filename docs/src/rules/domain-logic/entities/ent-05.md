---
code: ENT-05
title: L’identité est générée tôt quand elle sert avant la persistance
group: Identité
scope: [domain, driven]
style: [tactical]
severity: major
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

Générer l’identité avant de construire l’entity, et la passer au constructeur. La factory method s’en charge : l’entity et son event de création portent l’identité dès le départ. Une identité qui vient de la base (une séquence lue à l’avance) est fournie par le repository.

Pour le bug des collections, une égalité sur d’autres attributs est aussi acceptable, mais la génération précoce reste préférable.

## Adaptation

**Notre choix** : des UUIDv7, générés dans le domaine par la classe d’identité (`TransferId.generate()`), dans la factory method. Ils n’ont pas besoin de la base, et ils sont ordonnés dans le temps : ils conviennent aux index B-tree, contrairement aux UUIDv4.

## Exemple

```ts
// Avoid: the id only exists after the insert, the event goes out without it
const transfer = Transfer.draft(ownerId, amount, at); // records TransferDrafted with an undefined id
await this.transfers.save(transfer);
```

```ts
// Preferred: the factory method generates the identity before construction
static draft(owner: OwnerId, amount: Money, at: Date): Transfer {
  const transfer = new Transfer(TransferId.generate(), owner, amount);
  transfer.record<TransferDrafted>({
    ...eventMetadata(at),
    type: 'payments.transfer.TransferDrafted',
    transferId: transfer.id,
  });

  return transfer;
}
```
