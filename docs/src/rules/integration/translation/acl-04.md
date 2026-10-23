---
code: ACL-04
title: Une command tirée d’un event étranger compare les dates des faits
group: Données copiées
scope: [domain, driving]
style: [tactical, transaction-script]
severity: major
review: approved
sources:
  - "Can You Handle the Responsibility?"
---

# ACL-04 · Une command tirée d’un event étranger compare les dates des faits

<RuleMeta />

## Signal

- Un handler qui suspend ou rétablit un objet local d’après l’event reçu, sans comparer la date du fait à celle du dernier changement appliqué.
- Une seule date de mise à jour pour tout l’objet : un event en retard sur un attribut est rejeté à cause d’un autre attribut.
- Une date de changement enregistrée alors que la valeur reçue n’a pas changé.
- Une command tirée d’un event qui ne porte pas `occurredOn`.

## Pourquoi

Une suspension suivie d’un rétablissement peut arriver dans l’ordre inverse. Si rien ne le prévoit, l’objet local reste suspendu par erreur, et quelqu’un doit corriger la base à la main.

Chaque command porte la date du fait. Pour chaque groupe d’attributs, l’aggregate garde la date du dernier changement appliqué, et ignore toute command plus ancienne. Pour le nom, il n’enregistre la date que si la valeur change. Sinon, un event en retard qui apporte un vrai changement serait ignoré.

Le même mécanisme rend ces commands idempotentes quand un message est livré plusieurs fois. Ce suivi ne fait pas partie de l’ubiquitous language : il n’est toléré que parce qu’il reste caché dans l’aggregate.

## Exceptions

Un flux dont l’ordre est garanti de bout en bout, de l’outbox du producer jusqu’au consumer.

## Correction

- `occurredOn` dans chaque command tirée d’un event.
- Une date de dernier changement par groupe d’attributs, mise à jour seulement si la valeur change.

## Voir aussi

MSG-06 pour l’ordre des events en général. MSG-04 pour les doublons. EVT-05 pour la date du fait dans l’event.

## Exemple

Le bounded context `payments` garde une copie du titulaire qui paie : suspendu ou non, et son nom. Il la met à jour sur `HolderSuspended`, `HolderReinstated` et `HolderRenamed`, publiés par `wallets`.

```ts
export class Payer {
	#suspended: boolean;
	#suspendedChangedOn: Date;
	#name: HolderName;
	#nameChangedOn: Date;

	// ...

	suspend(asOf: Date): void {
		if (asOf <= this.#suspendedChangedOn) {
			return;
		}

		this.#suspended = true;
		this.#suspendedChangedOn = asOf;
	}

	reinstate(asOf: Date): void {
		if (asOf <= this.#suspendedChangedOn) {
			return;
		}

		this.#suspended = false;
		this.#suspendedChangedOn = asOf;
	}

	rename(name: HolderName, asOf: Date): void {
		if (asOf <= this.#nameChangedOn || name.equals(this.#name)) {
			return;
		}

		this.#name = name;
		this.#nameChangedOn = asOf;
	}
}
```

Un `HolderReinstated` arrivé avant le `HolderSuspended` qui le précède laisse le payer actif : la suspension, plus ancienne, est ignorée.
