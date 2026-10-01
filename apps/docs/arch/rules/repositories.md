# Repository rules

`alveolus arch check` applies these rules to every interface that extends `Repository` and every
class that implements one.

| Rule                          | Ensures                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `repository/location`         | Repository ports live in `domain/repositories/`.           |
| `repository/adapter-location` | Classes that implement a repository live in `driven/`.     |

### Keep the port in the domain, the implementation in driven

<div class="al-compare">

```ts [❌ Avoid]
// src/ordering/domain/repositories/order.repository.ts
export class OrderRepository implements Repository<Order> {
	constructor(private readonly db: Pool) {}
}
```

```ts [✅ Prefer]
// src/ordering/domain/repositories/order.repository.ts
export interface OrderRepository extends Repository<Order> {}

// src/ordering/driven/pg-order-repository.ts
export class PgOrderRepository implements OrderRepository {}
```

</div>

::: details Why?
The domain says what it needs, the adapter says how. With the database in the domain, the model
cannot be tested without it, and changing the storage means changing the model.
:::

## Troubleshooting

### `<Name>` is a repository port; declare it in a domain/repositories/ folder

Move the interface to `src/<bounded-context>/domain/repositories/`.

### `<Name>` implements a repository; declare it in a driven/ folder

Move the class to `src/<bounded-context>/driven/`. If it sits in `domain/`, turn it into an
interface that extends `Repository` and move the implementation to `driven/`.

## See also

- [Repositories](/core/domain/repositories), the building block
- [Project layout](../project-layout.md), where ports and adapters live
