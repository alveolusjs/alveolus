---
code: PER-13
title: Une lecture par pages ne saute aucune ligne et n’en lit aucune deux fois
group: Lectures
scope: [driven, application]
style: [tactical, transaction-script]
kind: safeguard
severity: blocking
severityNote: Mineure pour une liste seulement affichée, que l’utilisateur peut recharger.
detection: []
review: to-review
sources: []
---

# PER-13 · Une lecture par pages ne saute aucune ligne et n’en lit aucune deux fois

<RuleMeta />

## Signal

- Une page ordonnée par une date seule, que plusieurs lignes partagent.
- `skip: page * size` sur une table où des lignes s’insèrent pendant la lecture.
- Un traitement par lot, comme les frais du mois, qui parcourt une table page par page de l’une de ces façons.

## Pourquoi

Une page ordonnée par une valeur qui n’est pas unique montre une ligne deux fois, ou la saute. Un offset se décale quand une ligne est insérée ou supprimée avant la page, et fait lire puis jeter par la base toutes les lignes qui la précèdent. Sur un écran, c’est une ligne en double. Dans un traitement par lot, c’est un wallet jamais traité, ou traité deux fois.

## Exceptions

Aucune.

## Correction

Un ordre sur une clé unique, et une page qui commence après la dernière ligne lue. Un traitement par lot garde cette dernière ligne pour reprendre là où il s’est arrêté (PER-08).

```ts
const rows = await this.#prisma.ledgerEntry.findMany({
	where: { walletId, ...(after && { id: { lt: after } }) },
	orderBy: { id: 'desc' },
	take: limit,
});
```

## Adaptation

Les identités UUIDv7 se trient par date de création (ENT-05) : ordonner par identité donne l’ordre de création, sans ex æquo.

## Voir aussi

PER-06 borne chaque liste. PER-07 appuie la lecture sur un index.
