# Aggregate rules

`alveolus arch check` applies these rules to every class that extends `AggregateRoot`.

| Rule                                     | Ensures                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `aggregate/reference-by-identity`        | Other aggregates are referenced by identifier.                    |
| `aggregate/no-public-mutable-state`      | State changes only through business methods.                      |
| `aggregate/public-methods-return-result` | Business methods return a `Result`.                               |
| `aggregate/non-public-constructor`       | Aggregates are created through static factories.                  |
| `aggregate/from-snapshot`                | Aggregates can be rebuilt from their snapshot.                    |
| `aggregate/no-hidden-clock`              | The current date comes from the caller.                           |
| `aggregate/no-io`                        | No `Promise`, no repository inside the aggregate.                 |
| `aggregate/no-inheritance`               | Aggregates extend `AggregateRoot` directly.                       |
| `aggregate/one-per-file`                 | One aggregate per file.                                           |
| `aggregate/location`                     | Aggregates live in `domain/aggregates/`.                          |

### Reference other aggregates by identity

<div class="al-compare">

```ts [❌ Avoid]
readonly customer: Customer;
```

```ts [✅ Prefer]
readonly customerId: CustomerId;
```

</div>

::: details Why?
Holding another aggregate lets one transaction change two consistency boundaries, and loads a
whole graph of objects to change one. An identifier keeps each aggregate independent: load the
other one through its repository when you need it.

Methods may still return another aggregate, such as a factory method that creates it: returning it
does not keep a reference. Properties, parameters and getters are checked.
:::

### Change state through business methods

<div class="al-compare">

```ts [❌ Avoid]
status: Status = "draft";

order.status = "placed";
```

```ts [✅ Prefer]
private status: Status = "draft";

order.place(now);
```

</div>

::: details Why?
A public field lets any caller skip the business rules and the events. A method is the only place
where the rules are checked and the change is recorded.
:::

### Create aggregates through factories

<div class="al-compare">

```ts [❌ Avoid]
constructor(id: OrderId) {
	super(id);
}

const order = new Order(id);
```

```ts [✅ Prefer]
private constructor(id: OrderId) {
	super(id);
}

static create(id: OrderId): Order {
	return new Order(id);
}
```

</div>

::: details Why?
A public constructor lets any caller build the aggregate, including in an invalid state, and mixes
creation with restoring from storage. Named static factories, such as `create` and `restore`, say
which one is happening and are the single place for creation rules. They return a `Result` when the
input can be refused.
:::

### Return failures, do not throw them

<div class="al-compare">

```ts [❌ Avoid]
place(total: number): void {
	if (total <= 0) {
		throw new Error("Invalid total");
	}
}
```

```ts [✅ Prefer]
place(total: number): Result<void, InvalidTotal> {
	if (total <= 0) {
		return err(new InvalidTotal({ total }));
	}
	return ok();
}
```

</div>

::: details Why?
A thrown error does not appear in the signature: callers do not know it can happen and forget to
handle it. A `Result` lists every expected failure in the type, and TypeScript makes callers deal
with it.
:::

Getters, static methods, methods returning a `Promise` and the methods of
`toSnapshot()` ([snapshots](/core/domain/aggregates#export-and-restore-a-snapshot)) are not checked.

### Receive the date, do not read the clock

<div class="al-compare">

```ts [❌ Avoid]
place(total: number) {
	const now = new Date();
}
```

```ts [✅ Prefer]
place(total: number, now: Date) {
	…
}
```

</div>

::: details Why?
An aggregate that reads the clock behaves differently on each run, which makes its events and its
tests unpredictable. The application layer reads the clock once and passes the date in.
:::

### Keep I/O out of the aggregate

<div class="al-compare">

```ts [❌ Avoid]
async place(stock: StockRepository) {
	…
}
```

```ts [✅ Prefer]
place(available: number, now: Date) {
	…
}
```

</div>

::: details Why?
Loading data belongs to the application layer. The aggregate receives what it needs as values, so
it stays synchronous, fast and testable without a database.
:::

## Troubleshooting

### `<Name>` references aggregate `<Other>`; reference it by its identifier instead

Replace the property, parameter or getter type with the identifier of the other aggregate, such as
`CustomerId` instead of `Customer`. See [Reference other aggregates by identity](#reference-other-aggregates-by-identity).

### `<Name>.<member>` is public and mutable; make it readonly or private

Make the field `private` and add a business method that changes it, or make it `readonly` if it
never changes after creation.

### `<Name>.<method>` must return a Result; return ok() or err() from @alveolus/core

Return `ok()` when the method succeeds and `err(new SomeError())` when a rule fails. To expose
state, use a getter; to store it, use `toSnapshot()`.

### `<Name>` has a public constructor; make it protected or private and expose static factories

Mark the constructor `private` and add `static create(...)`, and `static fromSnapshot(...)` for
persistence.

### `<Name>` has no public static fromSnapshot; add one to rebuild it from its snapshot

Add `static fromSnapshot(snapshot, version)`, which rebuilds the aggregate from what `toSnapshot()`
returns without checking business rules or recording events.

### `<Name>` reads the clock with new Date(); receive the date as a parameter instead

Add a `now: Date` parameter to the method and pass the date from the application layer.

### `<Name>.<method>` returns a Promise; aggregates must not perform I/O

Move the asynchronous work to the application layer and pass its result to the method.

### `<Name>` depends on `<Repository>`; aggregates must not use repositories

Load the data in the application layer and pass it to the aggregate as values or identifiers.

### `<Name>` extends `<Base>`; aggregates must extend AggregateRoot directly

Extract the shared behaviour into a value object or a function instead of a base class.

### `<Name>` is not the only aggregate in `<file>`; move it to its own file

Create one file per aggregate in `domain/aggregates/`.

### `<Name>` is an aggregate; declare it in a domain/aggregates/ folder

Move the file to `src/<bounded-context>/domain/aggregates/`. See [Project layout](../project-layout.md).

## See also

- [Aggregates](/core/domain/aggregates), the building block
- [Entity rules](./entities.md), for the entities inside an aggregate
- [Project layout](../project-layout.md), for the location rules
