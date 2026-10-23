---
code: AGG-06
title: Une transaction ne modifie qu’une instance d’aggregate
group: Transactions et cohérence
scope: [application, driving]
style: [tactical]
severity: major
review: approved
sources:
  - "Rule: Model True Invariants in Consistency Boundaries"
  - "Rule: Reference Other Aggregates by Identity"
  - "Don't Trust Every Use Case"
  - "Reasons to Break the Rules"
---

# AGG-06 · Une transaction ne modifie qu’une instance d’aggregate

<RuleMeta />

## Signal

- Un use case, un handler ou un Unit of Work modifie et enregistre plusieurs instances d’aggregate existantes, du même type ou non.
- Une seule requête HTTP appelle des méthodes métier de plusieurs aggregates dans la même transaction.

## Pourquoi

Un aggregate est une frontière de cohérence transactionnelle. Modifier plusieurs instances par transaction multiplie les échecs au commit dès que plusieurs utilisateurs travaillent en même temps. C’est souvent le signe d’une frontière mal placée, ou d’un concept de l’ubiquitous language pas encore trouvé.

## Exceptions

Exceptions acceptées, chacune documentée :

- créer en batch des instances nouvelles et indépendantes, quand le batch donne le même résultat qu’une création une par une ;
- créer un nouvel aggregate par une factory method d’un autre aggregate, qui n’est pas modifié lui-même ;
- aucun mécanisme asynchrone n’est disponible, et un seul utilisateur travaille sur ces instances à la fois. C’est rare quand l’application a déjà une queue ou un outbox ;
- des transactions globales imposées par le système existant. Même alors, éviter de modifier plusieurs instances dans le bounded context local.

## Correction

Deux options :

- un invariant manque, et les éléments liés forment un nouveau concept (tant qu’il reste petit, AGG-12) ;
- ou la règle accepte un délai, et passe en eventual consistency par un domain event (AGG-08).

AGG-10 aide à trancher.

## Adaptation

En NestJS, le garde-fou le plus fiable est un contrôle à l’exécution dans le Unit of Work. Il refuse le commit si plus d’une instance existante a été modifiée, avec une allowlist pour les créations en batch.

## Exemple

```ts
// Avoid: the wallet lowers its own balance, so two aggregates are saved in the transaction
return this.#unitOfWork.run(async () => {
	const wallet = await this.#wallets.get(walletId);

	if (!wallet) {
		return err(new WalletNotFound(walletId));
	}

	const entry = wallet.debit(reference, amount, to, this.#clock.now());

	if (!entry.ok) {
		return entry;
	}

	await this.#wallets.save(wallet);
	const booked = await this.#journal.book(entry.value);

	if (!booked.ok) {
		return booked;
	}

	await this.#outbox.append(entry.value.pullEvents());

	return ok();
});
```

```ts
// Preferred: the wallet is only read, the entry is the only aggregate saved
return this.#unitOfWork.run(async () => {
	const wallet = await this.#wallets.get(walletId);

	if (!wallet) {
		return err(new WalletNotFound(walletId));
	}

	const entry = wallet.debit(reference, amount, to, this.#clock.now());

	if (!entry.ok) {
		return entry;
	}

	const booked = await this.#journal.book(entry.value);

	if (!booked.ok) {
		return booked;
	}

	await this.#outbox.append(entry.value.pullEvents());

	return ok();
});
```

Le wallet vérifie le débit et crée l’écriture sans changer lui-même. Seule l’écriture est enregistrée : le journal fait avancer le solde et la version du wallet en base, et deux débits simultanés se départagent sur cette version (AGG-15).
