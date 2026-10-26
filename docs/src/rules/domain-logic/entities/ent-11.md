---
code: ENT-11
title: Les méthodes du domaine sont nommées dans le langage du métier
group: Comportement
scope: [domain]
style: [tactical]
severity: minor
severityNote: Question quand un concept semble manquer. Un setter public relève d’ENT-10.
detection: []
review: approved
sources:
  - "How to Do DDD › Ubiquitous Language (Table 1.4)"
  - "The Challenges of Applying DDD"
---

# ENT-11 · Les méthodes du domaine sont nommées dans le langage du métier

<RuleMeta />

## Signal

- Des méthodes publiques du domaine nommées d’après la mécanique plutôt que l’intention : `set*`, `update*`, `save*`, `process*`, `handle*`, `manage*`.
- Des classes du domaine suffixées `Manager`, `Helper`, `Data`, `Info`.
- Un nom qui omet un acteur ou un concept que le métier nomme.

## Pourquoi

Le modèle emploie les noms, les verbes et les expressions que l’équipe prononce. Un nom technique impose une traduction à chaque lecture, et un expert métier ne peut plus relire le code.

## Exceptions

Les noms techniques hors du domaine (adapters `driving` et `driven`, controllers).

## Correction

Renommer d’après la phrase que l’équipe dit à voix haute. Si un concept semble manquer, le soulever comme une question : seul l’expert métier peut trancher.

## Exemple

L’équipe dit « on débite le wallet ».

```ts
// Avoid: the team says debit, the code says update
walletManager.updateBalance(walletId, amount.negate());
```

```ts
// Preferred: the code says what the team says
const entry = wallet.debit(reference, amount, to, this.#clock.now());

if (!entry.ok) {
	return entry;
}
```

Un expert métier lit `debit` et sait ce qui se passe. Devant `updateBalance` et un montant négatif, il doit deviner : un débit, une correction, des frais ? Et `WalletManager` ne dit rien de plus que `Wallet`.
