---
code: PER-06
title: Une liste est bornée et ordonnée par une clé stable
group: Lectures
scope: [driven, application]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# PER-06 · Une liste est bornée et ordonnée par une clé stable

<RuleMeta />

## Signal

- `findMany({ where: { walletId } })` sans `take` : toutes les écritures du wallet, d’un coup.
- Une page ordonnée par une date seule, que plusieurs lignes partagent.
- `skip: page * size` sur une table qui grossit à chaque seconde.

## Pourquoi

Une liste sans limite fonctionne en test et grossit en production : l’historique d’un wallet actif atteint des centaines de milliers d’écritures, et un seul appel les charge toutes en mémoire. Une page ordonnée par une valeur qui n’est pas unique montre une ligne deux fois, ou la saute. Un offset fait lire et jeter par la base toutes les lignes avant la page, et se décale quand une ligne est insérée.

## Exceptions

Une liste bornée par le métier : les devises qu’un wallet peut tenir, les blocages d’un wallet (AGG-12).

## Correction

Une limite sur chaque liste, un ordre sur une clé unique, et une page qui commence après la dernière ligne lue.

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

AGG-12 borne les collections d’un aggregate. PER-07 appuie la lecture sur un index.
