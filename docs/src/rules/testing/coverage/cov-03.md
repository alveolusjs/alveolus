---
code: COV-03
title: Un test de commande vérifie ses events
group: Preuves
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# COV-03 · Un test de commande vérifie ses events

<RuleMeta />

## Signal

- Un test qui vérifie l’état, jamais l’event enregistré.
- Un test qui compte les events sans lire leur contenu.
- Un refus dont aucun test ne vérifie qu’il ne publie rien.

## Pourquoi

Un event est une promesse faite aux autres bounded contexts. S’il disparaît ou perd un champ, l’état local reste juste et aucun test ne casse : c’est le bounded context qui en dépend qui s’arrête, sans erreur.

## Exceptions

Aucune.

## Correction

- Dans un test unitaire, Assert lit `pullDomainEvents()` : le type et le contenu de chaque event.
- Dans un test end-to-end, Assert lit le message de l’outbox, par un test driver.
- Après un refus, aucun event ni aucun message.

## Voir aussi

EVT-03 fait naître les events dans le modèle. MSG-01 les confie à l’outbox.

## Exemple

```ts
it('records the block of its debits', () => {
	// Arrange
	const wallet = openWallet('EUR');
	const reference = aBlockReference();

	// Act
	wallet.block(reference, debitsOnly, at);

	// Assert
	const events = wallet.pullDomainEvents().map((event) => [event.type, event.payload]);
	expect(events).toEqual([['WalletBlocked', { reference, directions: debitsOnly }]]);
});
```
