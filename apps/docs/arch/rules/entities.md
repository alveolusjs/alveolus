# Entity rules

`alveolus arch check` applies these rules to every class that extends `Entity` without being an
aggregate root.

| Rule                                  | Ensures                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| `entity/reference-by-identity`        | Aggregates, including its own, are referenced by identifier in properties, parameters and getters. |
| `entity/no-domain-events`             | Only the aggregate root records domain events.             |
| `entity/no-public-mutable-state`      | State changes only through methods.                        |
| `entity/public-methods-return-result` | Methods return a `Result`.                                 |
| `entity/non-public-constructor`       | Entities are created through static factories.             |
| `entity/from-snapshot`                | Entities can be rebuilt from their snapshot.               |
| `entity/no-hidden-clock`              | The current date comes from the caller.                    |
| `entity/no-io`                        | No `Promise`, no repository inside the entity.             |
| `entity/location`                     | Entities live in `domain/entities/`.                       |
| `identifier/location`                 | Identifiers live in `domain/value-objects/`.               |

### Leave events to the aggregate root

<div class="al-compare">

```ts [❌ Avoid]
ship(now: Date) {
	const event = new LineShipped(…);
}
```

```ts [✅ Prefer]
ship(now: Date): Result<void, never> {
	…
	return ok();
}
```

</div>

::: details Why?
The aggregate root is the only entry point of the aggregate: it decides what happened and records
it once. The root calls the entity, then records the event itself.
:::

## Troubleshooting

### `<Name>` references aggregate `<Aggregate>`; reference it by its identifier instead

Store the identifier of the aggregate, such as `OrderId`, even for the aggregate the entity belongs
to.

### `<Name>` creates domain event `<Event>`; only aggregate roots record domain events

Return a `Result` from the entity method, then record the event in the aggregate root method that
called it.

### `<Name>.<member>` is public and mutable; make it readonly or private

Make the field `private` and change it through a method, or `readonly` if it never changes.

### `<Name>.<method>` must return a Result; return ok() or err() from @alveolus/core

Return `ok()` or `err(...)`. To expose state, use a getter; to store it, use `toSnapshot()`.

### `<Name>` has a public constructor; make it protected or private and expose static factories

Mark the constructor `private` and add a `static create(...)`.

### `<Name>` has no public static fromSnapshot; add one to rebuild it from its snapshot

Add `static fromSnapshot(snapshot)`, which rebuilds the entity from what `toSnapshot()` returns.

### `<Name>` is an entity; declare it in a domain/entities/ folder

Move the file to `src/<bounded-context>/domain/entities/`.

### `<Name>` is an identifier; declare it in a domain/value-objects/ folder

Move the file to `src/<bounded-context>/domain/value-objects/`.

## See also

- [Entities](/core/domain/entities), the building block
- [Aggregate rules](./aggregates.md)
- [Project layout](../project-layout.md), for the location rules
