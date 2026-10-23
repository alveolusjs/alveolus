---
code: REP-10
title: "Pas de finder sur les parties : une lecture partielle est une query"
group: Requêtes
scope: [driven]
style: [tactical]
severity: major
review: approved
sources:
  - "Additional Behavior"
---

# REP-10 · Pas de finder sur les parties : une lecture partielle est une query

<RuleMeta />

## Signal

- Un finder de repository qui renvoie des parties d’un aggregate (`dueDatesOf(standingOrderId)`), au lieu de l’aggregate entier.
- Un tel finder ajouté pour un écran, là où une query sur une view suffit.

## Pourquoi

Un repository rend des aggregates entiers (REP-02). Un finder qui n’en rend que des parties ne sert ni à décider ni à afficher :

- pour décider, il faut l’aggregate root, qui seul protège les invariants ;
- pour afficher, une query lit une view, sans charger d’aggregate (UC-08).

D’un côté, le finder contourne l’aggregate root. De l’autre, il fait porter les lectures au modèle d’écriture.

## Exceptions

Aucune.

## Correction

Pour décider, charger l’aggregate entier et lui confier la décision. Pour afficher, une query qui lit une view, à travers un view port implémenté dans `driven`.

## Voir aussi

AGG-02 fait passer les parties par l’aggregate root. UC-08 interdit à une query de charger un aggregate. Selon AGG-12, un aggregate trop gros pour être chargé pose d’abord la question de sa frontière.

## Exemple

Un ordre de virement permanent porte ses échéances. Le titulaire veut voir la prochaine.

```ts
// Avoid: a finder on the parts, added to the repository for a screen
export abstract class StandingOrderRepository {
	abstract get(id: StandingOrderId): Promise<StandingOrder | undefined>;
	abstract save(order: StandingOrder): Promise<Result<void, never>>;
	abstract dueDatesOf(id: StandingOrderId): Promise<DueDate[]>;
}
```

```ts
// Preferred: a view and its port, on the query side
// application/standing-order/next-due-date.view.ts
export interface NextDueDateView {
	readonly dueOn: Date;
	readonly amount: Money;
}

// application/standing-order/standing-order-views.port.ts
export abstract class StandingOrderViews {
	abstract nextDueDate(id: StandingOrderId, after: Date): Promise<NextDueDateView | undefined>;
}
```

```ts
// application/standing-order/get-next-due-date.query.ts
async handle(query: GetNextDueDateQuery): Promise<Result<NextDueDateView, GetNextDueDateError>> {
	const id = StandingOrderId.of(query.standingOrderId);

	if (!id.ok) {
		return id;
	}

	const view = await this.#views.nextDueDate(id.value, this.#clock.now());

	return view ? ok(view) : err(new NoUpcomingDueDate(id.value));
}
```

La query ne charge pas l’ordre. Le view port, implémenté dans `driven`, lit la prochaine échéance directement sur les mêmes tables, avec un index sur l’ordre et la date (PER-07). Le repository n’a aucun finder de plus : il reste réservé aux commands.
