---
code: TST-02
title: Les tests du domaine se lisent dans le langage du métier
group: Ce qu’un test prouve
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: LLM
review: approved
sources:
  - "Justification for Domain Modeling › DDD Is Not Heavy"
---

# TST-02 · Les tests du domaine se lisent dans le langage du métier

<RuleMeta />

## Signal

- Des tests du domaine qui appellent des setters et des getters plutôt que des méthodes métier.
- Des noms de tests techniques (`should set status`).
- Des données irréalistes (`'foo'`, `'test'`, `123`), qui empêchent un expert métier de juger le scénario.

## Pourquoi

Les premiers tests montrent comment un client se sert de l’objet, et ils guident sa conception. Un expert métier qui n’est pas technique doit pouvoir les lire, avec l’aide d’un développeur, et juger si le modèle colle au langage. Il faut pour cela des données réalistes.

## Exceptions

Les tests exhaustifs écrits ensuite pour couvrir tous les cas. Ils peuvent être plus techniques, tant que des tests qui montrent l’usage existent.

## Correction

- Nommer chaque test comme une phrase du métier.
- Utiliser des montants, des devises et des noms crédibles.
- Appeler les méthodes métier.

## Voir aussi

TST-04 donne la forme d’un test : Arrange, Act, Assert.

## Exemple

```ts
// Avoid: a technical name, a setter, and data nobody can judge
it('should set status', () => {
	const holder = aHolder('foo');

	holder.setStatus('active');

	expect(holder.getStatus()).toBe('active');
});
```

```ts
// Preferred: a sentence of the business, a business method, credible data
it('refuses to reinstate a holder who is not suspended', () => {
	// Arrange
	const holder = anActiveHolder('Claire Martin');

	// Act
	const reinstated = holder.reinstate(at);

	// Assert
	expect(reinstated.ok ? undefined : reinstated.error.type).toBe('HolderIsNotSuspended');
});
```

Un expert métier lit le second test sans aide : on ne réintègre pas un titulaire qui n’est pas suspendu. Le premier ne lui dit rien : il vérifie qu’un champ garde ce qu’on y a écrit, pas une règle du métier.
