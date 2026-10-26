---
code: REP-08
title: La reconstitution n’impose ni setters ni constructeur vide au modèle
group: Stockage et reconstitution
scope: [domain, driven]
style: [tactical]
severity: major
detection: []
review: approved
sources:
  - "MongoDB Implementation (serialization through direct field access)"
---

# REP-08 · La reconstitution n’impose ni setters ni constructeur vide au modèle

<RuleMeta />

## Signal

- Un aggregate qui expose des setters publics ou un constructeur sans argument, utilisés seulement pour l’hydratation par l’ORM ou le mapper.
- Des propriétés publiques modifiables, ajoutées pour que l’ORM puisse les remplir.

## Pourquoi

Un sérialiseur peut lire et écrire les champs directement. Les objets du domaine n’ont donc pas besoin de getters et de setters publics, ce qui leur évite de devenir anémiques.

## Exceptions

Aucune.

## Correction

Le modèle n’expose que ses méthodes métier, celles qui modifient et celles qui lisent. La reconstitution passe par un chemin réservé à `driven`.

## Adaptation

En TypeScript, deux options :

- un modèle de persistance séparé, et un mapper dans `driven` ;
- une méthode statique de reconstitution (`Wallet.restore(snapshot)`) réservée au mapper, marquée `@internal` et vérifiée par un lint, comme le constructeur caché de FAC-03.

**Notre choix** : les deux à la fois. Les modèles Prisma sont les modèles de persistance, et le mapper de `driven` reconstitue l’aggregate par sa méthode `restore`, réservée à cet usage.

## Voir aussi

ENT-10 refuse l’anemic model. ENT-14 réserve à la reconstitution un chemin dédié et caché. FAC-03 cache le constructeur. LAY-01 refuse les decorators de l’ORM dans le domaine.

## Exemple

```ts
// Avoid: the wallet opens itself up so the mapper can fill it
const wallet = new Wallet();
wallet.id = row.id;
wallet.status = row.status;
wallet.balance = row.balance;
```

```ts
// Preferred: the mapper rebuilds the wallet through restore(), and the wallet keeps its fields private
toDomain(row: WalletRow): Wallet {
	const currency = this.stored(Currency.of(row.currency));

	return Wallet.restore({
		id: this.stored(WalletId.of(row.id)),
		holder: this.stored(HolderId.of(row.holderId)),
		balance: this.stored(Money.of(row.balance, currency)),
		status: row.status,
		// the account and the blocks, read the same way
	});
}
```

`restore` n’est appelée que par le mapper : elle est marquée `@internal`, et un lint le vérifie. Le wallet n’a ni constructeur vide ni setter. Hors de `driven`, on ne l’obtient que par `holder.openWallet()` ou par le repository.
