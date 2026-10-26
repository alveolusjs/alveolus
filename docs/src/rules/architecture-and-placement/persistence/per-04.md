---
code: PER-04
title: Une ligne stockée se relit par les vérifications du modèle, et une ligne corrompue arrête la lecture
group: Mappers
scope: [driven]
style: [tactical]
severity: major
detection: []
review: approved
sources: []
---

# PER-04 · Une ligne stockée se relit par les vérifications du modèle, et une ligne corrompue arrête la lecture

<RuleMeta />

## Signal

- `new Money(row.balance, currency)` par un constructeur qui saute les vérifications.
- Une valeur par défaut qui cache une ligne cassée : `row.currency ?? 'EUR'`, `row.balance ?? 0n`.
- Un value object refusé, écrit dans les logs, puis remplacé par une valeur de remplacement.

## Pourquoi

Une ligne peut être fausse : écrite à la main, par une ancienne version, par une migration boguée. Reconstruite sans les vérifications, elle devient un aggregate d’apparence valide, et la command suivante écrit par-dessus. Remplacée par une valeur par défaut, elle affiche un solde nul à un titulaire qui a de l’argent.

Un échec bruyant à la lecture arrête les dégâts dès la première requête, et désigne la ligne.

## Exceptions

Aucune.

## Correction

Le mapper reconstruit chaque valeur par la même factory qu’une valeur neuve. Un refus est une panne du stockage, pas un refus métier : il lève une exception.

```ts
export class WalletMapper extends RowMapper {
	toDomain(row: WalletRow): Wallet {
		const currency = this.stored(Currency.of(row.currency));

		return Wallet.restore({
			id: this.stored(WalletId.of(row.id)),
			balance: this.stored(Money.of(row.balance, currency)),
			status: row.status,
		});
	}
}
```

## Adaptation

**Notre choix** : les mappers étendent un `RowMapper` partagé. Sa méthode `stored` déballe le `Result` d’une factory : elle renvoie la valeur acceptée, ou lève `Corrupted row` avec la raison du refus.

```ts
// shared/driven/prisma/row.mapper.ts
export abstract class RowMapper {
	protected stored<T>(result: Result<T, AnyDomainError>): T {
		if (!result.ok) {
			throw new Error(`Corrupted row: ${result.error.type}`);
		}

		return result.value;
	}
}
```

Une valeur venue d’une requête et refusée est un refus métier, que le use case renvoie dans un `Result`. Une valeur venue de la base et refusée ne l’est pas : elle a été acceptée à l’écriture, ou la base a été modifiée par une autre voie. Aucun appelant ne peut la corriger, d’où l’exception.

## Voir aussi

REP-08 reconstruit l’aggregate par `restore`. REP-09 relit les anciennes formes d’un document.
