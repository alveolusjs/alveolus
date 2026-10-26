---
code: SRV-03
title: Garder hors du use case les processus métier qui portent sur plusieurs objets
group: Quand créer un domain service
scope: [application]
style: [tactical]
severity: major
detection: []
review: approved
sources:
  - "Make Sure You Need a Service (l'authentification)"
  - "A Calculation Process"
---

# SRV-03 · Garder hors du use case les processus métier qui portent sur plusieurs objets

<RuleMeta />

## Signal

- Un use case, ou un autre appelant, qui applique lui-même une règle métier sur plusieurs objets du domaine. Par exemple, le use case charge le wallet, vérifie qu’il n’est ni fermé ni bloqué au débit, vérifie le solde, additionne les retraits des dernières 24 heures et les compare au plafond.
- Une boucle de calcul métier dans l’application, même triviale.

## Pourquoi

Le savoir métier ne doit jamais fuir chez les appelants, même quand l’appelant est un use case. Le use case coordonne : il appelle les opérations du domaine qui décident, sans rien décider lui-même.

Même une simple somme dans une boucle est de la logique métier. Une valeur dérivée (`totalDebited = amount + fees`) ne doit pas non plus fuir dans la couche application.

## Exceptions

Aucune.

## Correction

Chaque règle dans le domaine : dans l’aggregate quand elle porte sur son état, dans un domain service nommé dans le langage quand elle porte sur plusieurs objets. Le use case appelle ces opérations, et transmet leurs refus.

## Voir aussi

AGG-01 et ENT-10 traitent d’une règle sur un seul aggregate, décidée hors de lui. UC-04 donne la taille attendue d’un use case. Cette règle traite d’une règle qui porte sur plusieurs objets, où un domain service s’impose.

## Exemple

```ts
// Avoid: the use case decides whether the withdrawal is allowed
if (wallet.status === 'closed') {
	return err(new WalletIsClosed(walletId));
}

if (wallet.blocks.some((block) => block.covers('debits'))) {
	return err(new DebitsBlocked(walletId));
}

if (wallet.balance.isLessThan(amount)) {
	return err(new InsufficientFunds(walletId));
}

const withdrawn = await this.#withdrawals.totalSince(walletId, dayBefore(now));

if (DAILY_LIMIT.isLessThan(withdrawn.plus(amount))) {
	return err(new WithdrawalLimitExceeded(walletId));
}
```

```ts
// Preferred: the use case coordinates, the domain decides
const allowed = await this.#withdrawalLimit.allows(walletId, amount, now);

if (!allowed) {
	return err(new WithdrawalLimitExceeded(walletId));
}

const entry = wallet.debit(reference, amount, to, now);

if (!entry.ok) {
	return entry;
}
```

Les règles du wallet sont dans `wallet.debit()`, et le plafond dans le domain service `WithdrawalLimit`, comme dans la vue d’ensemble. Le use case n’a plus aucune règle à connaître.
