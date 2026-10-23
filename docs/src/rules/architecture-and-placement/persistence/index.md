---
menu: Vue d’ensemble
---

# Persistance

Le modèle ne connaît pas la base, mais la base doit garder ce que le modèle décide, exactement et pendant des années. Ces règles couvrent ce qui vit derrière les repositories : un schéma qui appartient à son bounded context, avec les bons types et les bonnes contraintes, des mappers qui traduisent sans rien décider, des lectures bornées, des transactions courtes, et des migrations qui changent la forme des données sans changer leurs faits.

Le comportement d’un repository relève de [Repositories](../../domain-logic/repositories/) (REP) : des aggregates entiers, la transaction du use case, des erreurs de stockage gardées à l’intérieur.

## En pratique {#in-practice}

Le bounded context `wallets` d’une application de wallet.

```prisma
// prisma/wallets.prisma
model Wallet {
  id       String       @id @db.Uuid
  holderId String       @map("holder_id") @db.Uuid
  currency String       @db.Char(3)
  balance  BigInt
  status   WalletStatus
  openedAt DateTime     @map("opened_at") @db.Timestamptz(3)
  version  Int

  @@unique([holderId, currency])
  @@map("wallet")
  @@schema("wallets")
}
```

```ts
// driven/prisma/wallet.mapper.ts
export class WalletMapper extends RowMapper {
	toDomain(row: WalletRow): Wallet {
		const currency = this.stored(Currency.of(row.currency));

		return Wallet.restore({
			id: this.stored(WalletId.of(row.id)),
			holder: this.stored(HolderId.of(row.holderId)),
			balance: this.stored(Money.of(row.balance, currency)),
			status: row.status,
			openedAt: row.openedAt,
		});
	}
}
```

- La table vit dans le schéma de son bounded context, déclarée dans le fichier de son bounded context (PER-01).
- Le solde est un entier en unités mineures, la devise tient en trois lettres, l’instant porte son fuseau, le statut est un enum (PER-02).
- Un wallet par titulaire et par devise : la base refuse le second, même quand deux requêtes se croisent (PER-03).
- Le mapper reconstruit chaque valeur par ses vérifications, et une ligne corrompue arrête la lecture (PER-04, PER-05).
- Une liste de wallets est bornée et ordonnée, et chaque lecture courante a son index (PER-06, PER-07).
- Aucun appel distant dans la transaction, et un cumul se prend sous verrou (PER-08, PER-09).
- Le schéma change par des migrations, compatibles avec la version qui tourne, qui ne réécrivent jamais un fait (PER-10, PER-11, PER-12).

## Règles {#rules}

<RuleTable />
