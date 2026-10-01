# Scenarios

Describe each behaviour of an aggregate as a scenario: the aggregate in a known state, the action
under test, then the expected result and events.

```ts
given(Order.create(id))
	.when((order) => order.place(42, now))
	.thenSucceeded()
	.thenRecorded(OrderPlaced, { total: 42 });
```

## Usage

### Assert on recorded events

Events recorded while building the aggregate, such as by `Order.create`, are discarded: assertions
only see what the `when` action records.

```ts
given(Order.create(id))
	.when((order) => order.place(42, now))
	.thenRecorded(OrderPlaced, { total: 42 });
```

### Assert on a business error

```ts
given(Order.create(id))
	.when((order) => order.place(0, now))
	.thenFailedWith(InvalidTotal, { total: 0 })
	.thenRecordedNothing();
```

### Assert on the state

`aggregate` and `result` give access to the aggregate and to what the action returned.

```ts
const { aggregate } = given(Order.create(id)).when((order) => order.place(42, now));

expect(aggregate.isPlaced).toBe(true);
```

## Reference

```ts
function given<Aggregate extends AnyAggregateRoot>(
	aggregate: Aggregate,
): Given<Aggregate>
```

### Given

| Member         | Returns                         | Description                                           |
| -------------- | ------------------------------- | ----------------------------------------------------- |
| `when(action)` | `Scenario<Aggregate, Returned>` | Runs `action` on the aggregate and keeps its result.  |

### Scenario

| Member                                  | Returns     | Passes when                                                   |
| --------------------------------------- | ----------- | ------------------------------------------------------------- |
| `aggregate`                             | `Aggregate` | The aggregate, for other assertions.                          |
| `result`                                | `Returned`  | The value returned by the action.                             |
| `thenSucceeded()`                       | `this`      | The action returned a successful `Result`.                    |
| `thenFailedWith(ErrorClass, payload?)`  | `this`      | The action returned a failure with an `ErrorClass` error, with a deeply equal payload when given. |
| `thenRecorded(EventClass, payload?)`    | `this`      | An `EventClass` event was recorded, with a deeply equal payload when given. |
| `thenRecordedNothing()`                 | `this`      | No event was recorded.                                        |

| Type                     | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `DomainErrorClass<E>`    | A `DomainError` subclass, such as `InvalidTotal`.   |

**Caveats**

- Assertions chain and never clear the recorded events.

Import from `@alveolus/testing` or `@alveolus/testing/scenarios`.

## See also

- [Aggregates](/core/domain/aggregates), what a scenario tests
- [Event assertions](./event-assertions.md), outside a scenario
