---
code: REP-13
title: Le use case décide de la transaction
group: Transactions
scope: [application, driven]
style: [tactical]
severity: major
severityNote: Bloquante quand des écritures qui vont ensemble, comme l’aggregate et son outbox, peuvent être validées séparément.
detection: []
review: approved
sources:
  - "Managing Transactions (and chapter note 5)"
---

# REP-13 · Le use case décide de la transaction

<RuleMeta />

## Signal

- Un repository qui ouvre sa propre transaction dans `save` et en fait le commit (`dataSource.transaction(...)` ou `prisma.$transaction(...)` dans la méthode).
- Un aggregate, une entity ou un domain service qui gère une transaction.
- Un use case sans transaction, alors qu’il écrit plusieurs choses qui doivent rester ensemble, comme l’aggregate et son outbox.
- Un `run` imbriqué qui renvoie un refus, alors que le `run` qui l’englobe valide quand même : la transaction enregistre un travail que le use case imbriqué a refusé.

## Pourquoi

Le domaine n’est jamais le bon endroit pour gérer les transactions. Ses opérations sont trop fines, et n’ont pas à savoir qu’une transaction existe.

Les gérer dans la couche application : chaque use case ouvre la transaction, utilise le modèle, puis fait le commit, ou annule tout en cas d’échec. Déclaratif ou explicite, le principe est le même.

## Exceptions

Certains stockages n’ont pas de transactions ACID (beaucoup de bases NoSQL). Cette règle ne s’applique pas à eux.

## Correction

Un Unit of Work, ou un decorator transactionnel sur le use case. Les repositories n’ouvrent aucune transaction.

## Adaptation

**Notre choix** : le `UnitOfWork` de `@alveolus/core`, un port dont la méthode `run(work)` ouvre la transaction. `run` valide quand le travail renvoie `ok`, et annule quand il renvoie un `Err` ou lance une exception.

Un `run` imbriqué, celui d’un autre use case appelé dans la même transaction, rejoint la transaction ouverte. S’il renvoie un refus, la transaction ne peut plus être validée : si le `run` qui l’englobe renvoie quand même `ok`, core lance `NestedWorkRefused` et annule tout. Un refus ne se perd pas quand l’appelant oublie de le tester.

L’implémentation, dans `driven`, fournit deux méthodes. `transaction(scope, work)` ouvre une transaction interactive Prisma, y exécute `work`, et range le `scope` avec le client de transaction dans un `AsyncLocalStorage` (REP-14). `current()` y lit le `scope` ouvert. Core ne dépend ainsi d’aucun runtime.

## Voir aussi

SRV-05 interdit la transaction dans un domain service. UC-04 compte la transaction parmi les rôles légitimes du use case. MSG-01 enregistre l’état et les events dans la même transaction. REP-14 fait écrire les repositories dans cette transaction.

## Exemple

```ts
type OpenTransaction = { readonly client: Prisma.TransactionClient; readonly scope: TransactionScope };

export class PrismaUnitOfWork extends UnitOfWork {
	readonly #prisma: PrismaClient;
	readonly #open = new AsyncLocalStorage<OpenTransaction>();

	// constructor left out

	client(): Prisma.TransactionClient {
		return this.#open.getStore()?.client ?? this.#prisma;
	}

	protected current(): TransactionScope | undefined {
		return this.#open.getStore()?.scope;
	}

	protected transaction<R>(scope: TransactionScope, work: () => Promise<R>): Promise<R> {
		return this.#prisma.$transaction((client) => this.#open.run({ client, scope }, work));
	}
}
```

```ts
// Avoid: the use case drops the refusal of the ledger
return this.#unitOfWork.run(async () => {
	await this.#ledger.post(entry);

	return this.#transfers.save(transfer);
});
```

```ts
// Preferred: the use case returns the refusal of the ledger
return this.#unitOfWork.run(async () => {
	const posted = await this.#ledger.post(entry);

	if (!posted.ok) {
		return posted;
	}

	return this.#transfers.save(transfer);
});
```

L’adapter ne fait que deux choses : ouvrir la transaction Prisma, et dire laquelle est ouverte. `ledger.post` ouvre son propre `run`, qui rejoint la transaction. Dans le premier use case, son refus est perdu, mais la transaction est marquée : le `run` englobant lance `NestedWorkRefused` au lieu de valider, et rien n’est enregistré. Le second renvoie le refus (UC-02), et la transaction est annulée sans exception.
