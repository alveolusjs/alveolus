---
description: "Architecture rule: an aggregate, an entity, a value object or an identifier keeps its state private and exposes it through getters."
---

# no-public-field

An aggregate, an entity, a value object or an identifier keeps its state private: nothing outside
changes it, and what callers need is read through a getter.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tactical/no-public-field</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tactical">Tactical</a>: how building blocks are written</dd>
	<dt>Reports</dt><dd>A public instance field, declared or as a constructor parameter, <code>readonly</code> or not</dd>
	<dt>Applies to</dt><dd>Every class that extends <code>AggregateRoot</code>, <code>Entity</code>, <code>ValueObject</code> or <code>Identifier</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tactical/no-public-field": "off"</code></a></dd>
</dl>

## Why

`Account` has `public balance = 0`. The withdraw handler checks the balance and subtracts the
amount itself; the next handler does the same with a slightly different check. The rule "an
account never goes below its overdraft" now lives in four handlers, and the aggregate is a bag of
fields: the model is anemic, and the day the rule changes, nobody finds every copy.

::: tip The fix
The state is private, and changes through a method that returns a `Result`: `account.withdraw(amount)`.
A value the outside needs to read is a getter. The rule lives once, where the state is.
:::

## What it checks

Every instance field of a class that extends one of the four building blocks:

| Field | Allowed |
| --- | --- |
| `private balance`, `protected readonly opened` | ✅ |
| `constructor(private readonly currency: string)` | ✅ |
| `get balance(): Money` | ✅ |
| `public static readonly limit = 100` | ✅ |
| `public balance = 0`, `public readonly currency` | ❌ |
| `constructor(public readonly owner: string)` | ❌ |

A `readonly` public field is reported too: a value object of it can still be mutated, and the
getter keeps the shape of the class free to change.

## What it reports

```
src/ledger/domain/aggregates/account.aggregate.ts
  4  tactical/no-public-field: Account.balance is a public field:
     keep the state private, and expose what callers need through a
     getter.
```

## Fix it

### Change the state through a method

<div class="al-compare">

```ts [❌ Avoid: src/ledger/domain/aggregates/account.aggregate.ts]
export class Account extends AggregateRoot<AccountId> {
	public balance = 0;
}

// in a handler
if (account.balance >= amount) {
	account.balance -= amount;
}
```

```ts [✅ Prefer: src/ledger/domain/aggregates/account.aggregate.ts]
export class Account extends AggregateRoot<AccountId> {
	private balance = 0;

	get currentBalance(): number {
		return this.balance;
	}

	withdraw(amount: number): Result<void, InsufficientFunds> {
		if (this.balance < amount) {
			return err(new InsufficientFunds({ amount }));
		}
		this.balance -= amount;
		return ok();
	}
}
```

</div>

## Turn it off

```ts [alveolus.config.ts]
rules: { "tactical/no-public-field": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new fields stay private while you move the rules back into the aggregates.

## See also

- [Aggregates](../../core/domain/aggregates.md) and [Entities](../../core/domain/entities.md), what is checked
- [`tactical/no-thrown-failure`](./no-thrown-failure.md), which makes every change return a `Result`
- [Rules](../index.md), every rule by category
