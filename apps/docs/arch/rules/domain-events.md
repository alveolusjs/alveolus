# Domain event rules

`alveolus arch check` applies these rules to every class that extends `DomainEvent`.

| Rule                              | Ensures                                              |
| --------------------------------- | ---------------------------------------------------- |
| `domain-event/past-tense`         | Events are named after what happened.                |
| `domain-event/no-static-members`  | Events are created with `new`, by the aggregate.     |
| `domain-event/location`           | Domain events live in `domain/events/`.              |

### Name events in the past tense

<div class="al-compare">

```ts [❌ Avoid]
class PlaceOrder extends DomainEvent<OrderId, { total: number }> {}
class OrderPlacedEvent extends DomainEvent<OrderId, { total: number }> {}
```

```ts [✅ Prefer]
class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}
```

</div>

The last word of the class name must be a past form: a word ending in `-ed`, such as `Placed` or
`Cancelled`, or an irregular form such as `Sent`, `Paid` or `Withdrawn`.

::: details Why?
An event is a fact: it already happened and cannot be refused. An imperative name such as
`PlaceOrder` reads like a command, which can still fail. The name is also the event `type`, so a
suffix such as `Event` ends up in every message.
:::

### Keep events free of static members

<div class="al-compare">

```ts [❌ Avoid]
class OrderPlaced extends DomainEvent<OrderId, { total: number }> {
	static readonly TYPE = "order.placed";

	static of(order: Order): OrderPlaced { … }
}
```

```ts [✅ Prefer]
class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}

this.record(new OrderPlaced({ aggregateId: this.id, occurredAt: now, payload: { total } }));
```

</div>

::: details Why?
`type` already comes from the class name, so a type constant duplicates it and can drift. The
aggregate that records the event builds it with `new` and the date it received: a static factory
hides where the data and the date come from.
:::

## Troubleshooting

### `<Name>` is not named in the past tense; name the event after what happened, such as OrderPlaced

Rename the class after the fact it records, ending with the verb in the past tense: `OrderPlaced`
rather than `PlaceOrder` or `OrderPlacedEvent`. If the name is in the past tense but not
recognised, such as an uncommon irregular verb, use a regular synonym.

### `<Name>.<member>` is static; domain events have no static members

Remove the member. Build the event with `new` in the aggregate, and read its type from `type`.

### `<Name>` has a static block; domain events have no static members

Remove the static block.

### `<Name>` is a domain event; declare it in a domain/events/ folder

Move the file to `src/<bounded-context>/domain/events/`. See [Project layout](../project-layout.md).

## See also

- [Domain Events](/core/domain/domain-events), the building block
- [Entity rules](./entities.md#leave-events-to-the-aggregate-root), which leave events to the root
