---
code: REP-15
title: Un repository partagé seulement pour des types interchangeables
group: Hiérarchies de types
scope: [domain, driven]
style: [tactical]
severity: minor
severityNote: Mineure pour un cas isolé. Majeure quand l’aiguillage sur le type devient la norme chez les appelants.
detection: hybrid
detectionNote: Des finders par sous-type, des instanceof ou des switch sur le type d’un aggregate dans l’application.
review: approved
sources:
  - "Type Hierarchies"
---

# REP-15 · Un repository partagé seulement pour des types interchangeables

<RuleMeta />

## Signal

- Un repository partagé par plusieurs sous-types d’aggregate, avec un finder par sous-type (`cardPaymentOf(id)`, `transferPaymentOf(id)`).
- Un type encodé dans l’identité et lu par les appelants (`id.isCard()`, un préfixe dans l’identifiant).
- Un appelant qui aiguille par `if`, `switch` ou `instanceof` sur le type de l’aggregate qu’il reçoit, pour appeler des opérations différentes.

## Pourquoi

Une hiérarchie ne partage un repository que si les appelants utilisent ses instances de façon interchangeable (principe de substitution de Liskov). Le finder partagé renvoie alors le type de base.

Les finders typés obligent l’appelant à savoir quelle identité mène à quel type. Il risque une recherche vide ou une erreur de type. Encoder le type dans l’identité ne fait que déplacer le problème : l’appelant doit toujours résoudre le type, et il se lie aux opérations propres à chaque sous-type.

## Exceptions

- Un aiguillage rare et isolé, si la hiérarchie apporte beaucoup.
- Avec deux ou trois sous-types peu interchangeables : des repositories séparés.
- Avec de nombreux sous-types interchangeables : un repository partagé.

## Correction

Le plus souvent, un seul type d’aggregate qui porte son type en propriété (un type standard) et aiguille en interne, éventuellement avec le pattern State. Ou une interface de rôle, implémentée par plusieurs aggregates.

## Voir aussi

VO-08 ferme la liste des types standard. ENT-03 fait de l’identité un value object.

## Exemple

Un paiement se fait par carte ou par virement, et un remboursement suit le même moyen.

```ts
// Avoid: one subtype per payment method, and a use case that must know which one it holds
const payment = await this.#payments.get(id);

if (payment instanceof CardPayment) {
	payment.refundToCard(amount, this.#clock.now());
} else if (payment instanceof TransferPayment) {
	payment.refundByTransfer(amount, this.#clock.now());
}
```

```ts
// Preferred: one aggregate that carries its method, and a single operation
const payment = await this.#payments.get(id);

if (!payment) {
	return err(new PaymentNotFound(id));
}

const refunded = payment.refund(amount, this.#clock.now());

if (!refunded.ok) {
	return refunded;
}
```

```ts
// domain/payment/payment.aggregate.ts
refund(amount: Amount, at: Date): Result<void, RefundExceedsPayment> {
	// checks the amount against what is left to refund, then records PaymentRefunded with this.#method
}
```

Le moyen de paiement est un type standard porté par le paiement (`type PaymentMethod = 'card' | 'transfer'`, VO-08). Le paiement aiguille en interne, l’event dit par quel moyen rembourser, et le use case n’appelle qu’une opération. Le repository n’a qu’un `get`, qui renvoie un `Payment`.
