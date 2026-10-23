---
code: REP-14
title: Les repositories écrivent dans la transaction ouverte par l’application
group: Transactions
scope: [driven]
style: [tactical]
severity: blocking
review: approved
sources:
  - "Managing Transactions (access to the same session or Unit of Work)"
---

# REP-14 · Les repositories écrivent dans la transaction ouverte par l’application

<RuleMeta />

## Signal

- Un repository qui écrit par le pool, le `DataSource` ou le client global injecté, au lieu du contexte transactionnel en cours.
- L’aggregate root et ses parties écrits par des requêtes séparées, hors de la transaction : un échec laisse un aggregate à moitié enregistré.
- L’outbox écrit par une autre connexion que l’aggregate.

## Pourquoi

Les changements du domaine doivent être validés ou annulés ensemble. Les repositories doivent donc utiliser la même session, le même Unit of Work et la même transaction que l’application.

La technique compte peu, tant que ce partage est garanti.

## Exceptions

Aucune.

## Correction

Chaque repository utilise le client de la transaction en cours. Un test d’intégration fait échouer l’écriture d’une partie, et vérifie que l’aggregate root n’a pas changé.

## Adaptation

En Node, deux façons de partager ce contexte :

- passer explicitement le contexte transactionnel (`EntityManager`, client de transaction Prisma, `PoolClient`) par un Unit of Work ;
- ou le porter avec `AsyncLocalStorage`, directement ou par une bibliothèque comme `nestjs-cls`.

Avec un pool `pg`, deux appels `pool.query` peuvent passer par deux connexions différentes, donc hors de toute transaction partagée.

**Notre choix** : `AsyncLocalStorage`. L’implémentation du Unit of Work range le client de transaction Prisma dans le contexte asynchrone, et chaque repository l’y lit. Avec Prisma, le piège équivalent au pool consiste à écrire avec le `PrismaClient` injecté au lieu du client de transaction.

## Voir aussi

MSG-01 enregistre l’aggregate et ses events ensemble. AGG-15 protège l’aggregate par sa version. REP-02 écrit l’aggregate entier.

## Exemple

```ts
// Avoid: the injected PrismaClient writes outside the transaction opened by the use case
async save(wallet: Wallet): Promise<Result<void, WalletAlreadyOpen>> {
	const { id, ...data } = this.#mapper.toRow(wallet);

	await this.#prisma.wallet.update({ where: { id }, data });
	await this.#prisma.walletBlock.deleteMany({ where: { walletId: id } });
	await this.#prisma.walletBlock.createMany({ data: this.#mapper.toBlockRows(wallet) });

	return ok();
}
```

```ts
// Preferred: the client of the current transaction, read from the async context
async save(wallet: Wallet): Promise<Result<void, WalletAlreadyOpen>> {
	const db = this.#unitOfWork.client();
	const { id, ...data } = this.#mapper.toRow(wallet);

	await db.wallet.update({ where: { id }, data });
	await db.walletBlock.deleteMany({ where: { walletId: id } });
	await db.walletBlock.createMany({ data: this.#mapper.toBlockRows(wallet) });

	return ok();
}
```

Dans le premier bloc, si `createMany` échoue, le wallet est déjà mis à jour et ses anciens blocages sont supprimés : il perd ses blocages en base. Dans le second, la transaction du use case annule tout. La vérification de version et le refus `WalletAlreadyOpen` sont omis ici : la vue d’ensemble les montre.
