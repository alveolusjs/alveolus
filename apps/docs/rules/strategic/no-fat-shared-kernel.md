---
description: "Architecture rule: the shared kernel holds value objects, ports and their adapters, never an aggregate, a repository or a handler."
---

# no-fat-shared-kernel

The shared kernel stays small: value objects, identifiers, errors, ports and their adapters.
Everything that changes with a business belongs to one bounded context.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>strategic/no-fat-shared-kernel</code></dd>
	<dt>Category</dt><dd><a href="/rules/#strategic">Strategic</a>: what crosses a bounded context</dd>
	<dt>Reports</dt><dd>An <code>AggregateRoot</code>, an <code>Entity</code>, a <code>DomainEvent</code>, a <code>DomainService</code>, a repository, a handler or an <code>EventTranslator</code> in the shared kernel</dd>
	<dt>Applies to</dt><dd>Every class of the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"strategic/no-fat-shared-kernel": "off"</code></a></dd>
</dl>

## Why

`Customer` is needed by every context, so it lands in the shared kernel. From then on every
context depends on its shape, its rules and its repository; the KYC team cannot change how a
customer is verified without a change that reaches the whole system. The shared kernel has become
the one model nobody can touch.

::: tip The fix
Each context keeps its own view of a customer, under its own name: a `Payer` in payments, an
`Applicant` in KYC, each with the fields it needs. What they share is small and stable: the
`CustomerId`, the `Money` value object, the ports every context uses.
:::

## What it checks

Every class in the shared kernel, by what it extends:

| Class | Allowed |
| --- | --- |
| A `ValueObject`, an `Identifier`, a `DomainError` | ✅ |
| A `Port`, abstract or implemented by an adapter: a tracer, an outbox, a clock | ✅ |
| A representation of the published language | ✅ |
| An `AggregateRoot`, an `Entity`, a `DomainEvent`, a `DomainService` | ❌ |
| A `CommandRepository`, a `QueryRepository` | ❌ |
| A `CommandHandler`, a `QueryHandler`, an `EventTranslator` | ❌ |

## What it reports

```
src/shared-kernel/domain/aggregates/customer.aggregate.ts
  3  error  strategic/no-fat-shared-kernel: Customer is an AggregateRoot in
     the shared kernel: it belongs to one bounded context; the shared
     kernel holds value objects, ports and their adapters.
```

## Fix it

### Give the aggregate a home

So that one team owns it, move the aggregate, its repository and its handlers to the context that
decides its rules, and expose what the others need through an
[open host service](../../core/strategic/open-host-services.md). The identifier stays in the
shared kernel.

## Limits

::: warning What the rule cannot see
- How big the shared kernel is: three hundred value objects pass. In review, a value object enters
  the shared kernel when two contexts already have the same one, not before.
- A folder declared as a bounded context named `shared` or `common` is a context, not the shared
  kernel: the rule does not apply to it, and every other rule treats it as one more context.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "strategic/no-fat-shared-kernel": "off" },
```

## See also

- [Project layout: shared kernel](../../guide/project-layout.md#shared-kernel)
- [`strategic/no-shared-state`](./no-shared-state.md), no state in the shared kernel either
- [`strategic/no-unmapped-context`](./no-unmapped-context.md), the other way contexts get tied
- [Rules](../index.md), every rule by category
