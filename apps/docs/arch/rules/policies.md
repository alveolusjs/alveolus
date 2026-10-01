# Policy rules

`alveolus arch check` applies these rules to every class that extends `Policy`.

| Rule                      | Ensures                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `policy/stateless`        | No mutable field, no setter, no aggregate or entity in a field. |
| `policy/no-hidden-clock`  | The current date comes from the caller.                         |
| `policy/no-io`            | No `Promise`, no repository inside the policy.                  |
| `policy/location`         | Policies live in `domain/policies/`.                            |

### Keep the policy stateless

<div class="al-compare">

```ts [❌ Avoid]
class OverbookingPolicy extends Policy<Cargo, VoyageOverbooked> {
	private voyage: Voyage;
}
```

```ts [✅ Prefer]
class OverbookingPolicy extends Policy<Booking, VoyageOverbooked> {
	check({ voyage, cargo }: Booking) { … }
}
```

</div>

::: details Why?
A stateless policy gives the same answer for the same subject, so it can be shared, replaced and
tested with plain values. Configuration values in `readonly` fields are fine.
:::

### Receive the date, do not read the clock

<div class="al-compare">

```ts [❌ Avoid]
check(order: Order) {
	const now = new Date();
}
```

```ts [✅ Prefer]
check({ order, now }: Cancellation) {
	…
}
```

</div>

::: details Why?
A rule that reads the clock answers differently on each run. Put the date in the subject, and the
application layer reads the clock once.
:::

## Troubleshooting

### `<Name>.<member>` is mutable; policies are stateless

Make the field `readonly` and set it in the constructor, or move the value into the subject.

### `<Name>.<member>` is a setter; policies are stateless

Remove the setter and move the value into the subject.

### `<Name>` changes its own state; policies are stateless

Remove the assignment: `check` only reads its subject and returns a `Result`.

### `<Name>.<member>` holds `<Aggregate>`; pass it as a parameter, policies are stateless

Remove the field and add the aggregate or entity to the subject.

### `<Name>` reads the clock with new Date(); receive the date as a parameter instead

Add the date to the subject and pass it from the application layer.

### `<Name>.<method>` returns a Promise; policies must not perform I/O

Load the data in the application layer and put it in the subject.

### `<Name>` depends on `<Repository>`; policies must not use repositories

Load the aggregates in the application layer and put them in the subject.

### `<Name>` is a policy; declare it in a domain/policies/ folder

Move the file to `src/<bounded-context>/domain/policies/`. See [Project layout](../project-layout.md).

## See also

- [Policies](/core/domain/policies), the building block
- [Domain service rules](./domain-services.md), the same rules for domain services
