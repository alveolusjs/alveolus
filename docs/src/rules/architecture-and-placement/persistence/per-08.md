---
code: PER-08
title: Une transaction ne fait aucun appel distant et reste courte
group: Transactions
scope: [application, driven]
style: [tactical, transaction-script]
severity: major
severityNote: Bloquante pour un effet qui ne s’annule pas, comme un e-mail ou un message, envoyé dans la transaction.
detection: []
review: approved
sources:
  - "Managing Transactions"
---

# PER-08 · Une transaction ne fait aucun appel distant et reste courte

<RuleMeta />

## Signal

- Un appel à un fournisseur de taux de change à l’intérieur de `unitOfWork.run`.
- Un e-mail envoyé dans la transaction.
- Une seule transaction qui parcourt tous les wallets pour prélever des frais mensuels.

## Pourquoi

Une transaction garde une connexion du pool, et les verrous des lignes qu’elle a écrites, jusqu’à sa fin. Un appel distant à l’intérieur les garde aussi longtemps que le partenaire met à répondre : quand le partenaire ralentit, le pool s’épuise et toute l’application s’arrête, y compris les requêtes qui ne l’appellent jamais.

Un appel distant ne s’annule pas non plus. L’e-mail part, puis la transaction échoue : le titulaire apprend un dépôt qui n’existe pas.

## Exceptions

Aucune.

## Correction

- Ce dont la transaction a besoin à l’extérieur se lit avant qu’elle ne commence : le taux, puis la transaction.
- Ce qui doit se passer après passe par l’outbox, dans la même transaction, et part une fois le commit fait (MSG-01).
- Un traitement par lot se découpe en une transaction par aggregate (AGG-06), et reprend là où il s’est arrêté.

```ts
const rate = await this.#rates.current(command.from, command.to);

return this.#unitOfWork.run(async () => {
	const wallet = await this.#wallets.get(walletId);

	// convert with the rate fetched above, then let the wallet decide
});
```

## Voir aussi

REP-13 laisse le use case ouvrir la transaction. PRC-01 traite un appel distant comme distant.
