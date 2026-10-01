# Domain service rules

`alveolus arch check` applies these rules to every class that extends `DomainService`.

| Rule                              | Ensures                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `domain-service/stateless`        | No mutable field, no setter, no aggregate or entity in a field. |
| `domain-service/no-hidden-clock`  | The current date comes from the caller.                      |
| `domain-service/no-io`            | No `Promise`, no repository inside the service.              |
| `domain-service/location`         | Domain services live in `domain/services/`.                  |

### Keep the service stateless

<div class="al-compare">

```ts [❌ Avoid]
class ShippingCostCalculator extends DomainService {
	private order: Order;

	costOf(destination: Address) { … }
}
```

```ts [✅ Prefer]
class ShippingCostCalculator extends DomainService {
	costOf(order: Order, destination: Address) { … }
}
```

</div>

::: details Why?
A stateless service gives the same answer for the same inputs, can be shared by every use case and
needs no setup in tests. State belongs to aggregates, which protect it with their rules.
:::

### Keep I/O out of the service

<div class="al-compare">

```ts [❌ Avoid]
async costOf(orderId: OrderId) {
	const order = await this.orders.findById(orderId);
}
```

```ts [✅ Prefer]
costOf(order: Order, destination: Address) {
	…
}
```

</div>

::: details Why?
Loading and saving belong to the application layer. A service that receives its data stays
synchronous and testable without a database, like the rest of the domain.
:::

## Troubleshooting

### `<Name>.<member>` is mutable; domain services are stateless

Make the field `readonly` and set it in the constructor, or pass the value as a method parameter.

### `<Name>.<member>` is a setter; domain services are stateless

Remove the setter and pass the value as a method parameter.

### `<Name>` changes its own state; domain services are stateless

Return the result instead of storing it on `this`.

### `<Name>.<member>` holds `<Aggregate>`; pass it as a parameter, domain services are stateless

Remove the field and add the aggregate or entity as a parameter of the methods that need it.

### `<Name>` reads the clock with new Date(); receive the date as a parameter instead

Add a `now: Date` parameter and pass the date from the application layer.

### `<Name>.<method>` returns a Promise; domain services must not perform I/O

Move the asynchronous work to the application layer and pass its result to the method.

### `<Name>` depends on `<Repository>`; domain services must not use repositories

Load the aggregates in the application layer and pass them to the service.

### `<Name>` is a domain service; declare it in a domain/services/ folder

Move the file to `src/<bounded-context>/domain/services/`. See [Project layout](../project-layout.md).

## See also

- [Domain Services](/core/domain/domain-services), the building block
- [Aggregate rules](./aggregates.md), which apply the same clock and I/O rules
