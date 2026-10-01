# Event assertions

Assert on the domain events an aggregate recorded, outside a [scenario](./scenarios.md): after a use
case, for instance. Assertions read `domainEvents` and never clear them.

```ts
const event = assertRecorded(order, OrderPlaced, { total: 42 });
expect(event.occurredAt).toEqual(now);
```

## Reference

### assertRecorded

```ts
function assertRecorded<Event>(
	aggregate: RecordsDomainEvents,
	eventClass: DomainEventClass<Event>,
	payload?: Event["payload"],
): Event
```

Passes when `aggregate` recorded an `eventClass` event, with a deeply equal payload when given.
Returns the matching event.

### assertRecordedNothing

```ts
function assertRecordedNothing(aggregate: RecordsDomainEvents): void
```

Passes when `aggregate` recorded no event.

### Types

| Type                     | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `DomainEventClass<E>`    | A `DomainEvent` subclass, such as `OrderPlaced`.    |
| `RecordsDomainEvents`    | Anything with `domainEvents`, such as an aggregate. |

Import from `@alveolus/testing` or `@alveolus/testing/event-assertions`.

## See also

- [Domain Events](/core/domain/domain-events), what these assertions check
- [Scenarios](./scenarios.md), which use them
