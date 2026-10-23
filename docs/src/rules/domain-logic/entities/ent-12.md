---
code: ENT-12
title: Une intention, une méthode, un event
group: Comportement
scope: [domain]
style: [tactical]
severity: major
severityNote: Majeure pour plusieurs setters par intention. Mineure pour un seul setter que le langage ne justifie pas.
detection: hybrid
review: approved
sources:
  - "Discovering Entities and Their Intrinsic Characteristics › Digging for Essential Behavior"
---

# ENT-12 · Une intention, une méthode, un event

<RuleMeta />

## Signal

- Plusieurs setters publics à appeler pour mener à bien une seule intention.
- Un `setActive(boolean)` là où le métier dit « activer » et « désactiver ».

## Pourquoi

Plusieurs setters rendent l’intention ambiguë. Ils empêchent aussi d’enregistrer un seul domain event porteur de sens pour ce qui devrait être une seule opération. Remplacer `setActive` par `activate()` et `deactivate()`, les mots des experts métier.

## Exceptions

Les setters publics ne sont pas interdits. Un setter convient quand le langage le justifie et qu’il porte à lui seul l’intention.

## Correction

Une méthode nommée dans le langage, qui enregistre un event à la fin.

## Voir aussi

ENT-10 et ENT-11 visent le même défaut. Cette règle ajoute l’exception ci-dessus, pour éviter les faux positifs.

## Exemple

```ts
// Avoid: two setters for one intent, and no event
holder.setSuspended(true);
holder.setSuspendedAt(this.#clock.now());
```

```ts
// Preferred: one method per intent, each records its event
// suspend(at) refuses a suspended holder and records HolderSuspended, as in AGG-07

reinstate(at: Date): Result<void, HolderIsNotSuspended> {
	if (this.#status !== 'suspended') {
		return err(new HolderIsNotSuspended(this.id));
	}

	this.#status = 'active';
	this.record<HolderReinstated>({
		...eventMetadata(at),
		type: 'wallets.holder.HolderReinstated',
		holderId: this.id,
	});

	return ok();
}
```

Avec `setSuspended`, rien ne dit si l’on suspend le titulaire ou si l’on corrige une donnée, et aucun event n’est enregistré. `suspend()` et `reinstate()` disent l’intention, refusent ce qui n’a pas de sens, et enregistrent chacun leur event.
