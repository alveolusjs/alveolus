---
code: ENT-15
title: Chaque attribut est protégé par une précondition
group: Construction et validation
scope: [domain]
style: [tactical]
severity: minor
detection: []
review: approved
sources:
  - "Validation › Validating Attributes/Properties"
---

# ENT-15 · Chaque attribut est protégé par une précondition

<RuleMeta />

## Signal

- Un attribut du domaine affecté sans aucune précondition, alors qu’une valeur nulle, vide, trop longue, hors bornes ou mal formée n’a pas de sens.
- Des vérifications laissées à la base. Elles remontent en erreurs SQL, qu’on ne peut pas transformer en message utile.

## Pourquoi

Affecter par des setters privés (self-encapsulation) qui vérifient des préconditions, comme en design by contract. Quand chaque attribut d’une entity est valide, la validation de l’objet entier devient plus simple.

Une erreur « valeur trop longue » renvoyée par la base ne dit même pas quelle colonne a débordé. Et la contrainte de longueur peut venir du domaine lui-même, par exemple d’un système externe.

## Exceptions

Une contrainte impossible à atteindre, comme une colonne de taille illimitée. Le niveau de détail des préconditions se discute aussi.

## Correction

Les préconditions vivent dans les value objects et dans les méthodes de l’entity.

## Adaptation

**Notre choix** : une précondition qui refuse une valeur venue de l’extérieur renvoie un `Result`. Une précondition qui ne peut échouer que sur un bug, comme un invariant interne violé, lance une exception.

## Voir aussi

AGG-01 laisse la validation des entrées à l’application. Les deux coexistent : l’application valide l’entrée, le modèle protège son état.

## Exemple

```ts
export class HolderName {
	private constructor(readonly value: string) {}

	static of(raw: string): Result<HolderName, InvalidHolderName> {
		const name = raw.trim();

		if (!name) {
			return err(new InvalidHolderName('required'));
		}

		if (name.length > MAX_LENGTH) {
			return err(new InvalidHolderName('too long'));
		}

		if (!ALLOWED_CHARACTERS.test(name)) {
			return err(new InvalidHolderName('characters'));
		}

		return ok(new HolderName(name));
	}
}
```

`MAX_LENGTH` et `ALLOWED_CHARACTERS` sont des choix de l’application, déclarés à côté de la classe. L’entity reçoit un `HolderName` déjà valide : elle n’a plus rien à vérifier sur le nom.
