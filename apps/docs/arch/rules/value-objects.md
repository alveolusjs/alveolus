# Value object rules

`alveolus arch check` applies these rules to every class that extends `ValueObject`.

| Rule                                   | Ensures                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| `value-object/immutable`               | No mutable property, no setter, no change after construction. |
| `value-object/no-identity`             | No identifier, entity or aggregate inside a value object.    |
| `value-object/factories-return-result` | Static factories validate input and return a `Result`.        |
| `value-object/non-public-constructor`  | Value objects are created through static factories.         |
| `value-object/no-hidden-clock`         | The current date comes from the caller.                      |
| `value-object/no-io`                   | No `Promise`, no repository inside the value object.          |
| `value-object/location`                | Value objects live in `domain/value-objects/`.               |

### Return a new instance instead of changing state

<div class="al-compare">

```ts [❌ Avoid]
add(other: Money): void {
	this.amount += other.amount;
}
```

```ts [✅ Prefer]
add(other: Money): Money {
	return new Money({ … });
}
```

</div>

::: details Why?
A value object can be shared by several entities. If it changed, all of them would change at once
without knowing it. Returning a new instance keeps every holder safe.
:::

### Hold values, not identities

<div class="al-compare">

```ts [❌ Avoid]
class Snapshot extends ValueObject<{
	order: Order;
}> {}
```

```ts [✅ Prefer]
class Snapshot extends ValueObject<{
	total: Money;
}> {}
```

</div>

::: details Why?
Something with an identity changes over time, which breaks the immutability and the equality of
the value object. Keep the values you need, or move the concept to an entity.
:::

## Troubleshooting

### `<Name>.<member>` is mutable; make it readonly

Mark the property `readonly`, or move it into `props`.

### `<Name>.<member>` is a setter; value objects are immutable

Replace the setter with a method that returns a new instance.

### `<Name>` changes its own state; return a new instance instead

Build and return a new value object instead of assigning to `this` outside the constructor.

### `<Name>` references `<Type>`, which has an identity; value objects hold values only

Remove the identifier, entity or aggregate from the props, properties, parameters and return types.

### `<Name>.<method>` must return a Result; validate the input and return ok() or err()

Return `ok(new Name(...))` when the input is valid and `err(...)` otherwise.

### `<Name>` is a value object; declare it in a domain/value-objects/ folder

Move the file to `src/<bounded-context>/domain/value-objects/`, or to
`src/shared-kernel/domain/value-objects/` when every bounded context uses it.

## See also

- [Value Objects](/core/domain/value-objects), the building block
- [Project layout](../project-layout.md), for the location rules
