---
description: "Architecture rule: a bounded context consumes only the contexts its context map declares, and two contexts never depend on each other."
---

# no-unmapped-context

A bounded context consumes the contexts its context map declares, and nothing else: two contexts
never depend on each other.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>strategic/no-unmapped-context</code></dd>
	<dt>Category</dt><dd><a href="/rules/#strategic">Strategic</a>: what crosses a bounded context</dd>
	<dt>Reports</dt><dd>An import of another context that <code>contextMap</code> does not allow; without a map, an import that closes a cycle between contexts</dd>
	<dt>Applies to</dt><dd>Every file of every bounded context</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"strategic/no-unmapped-context": "off"</code></a></dd>
</dl>

## Why

`Payments` reads balances from `Ledger`, through its open host service, as it should. A year
later `Ledger` asks `Payments` whether a transfer is pending, through *its* open host service.
Each import is clean on its own; together they tie the two contexts: neither can be deployed,
extracted or rewritten without the other. In a system that lives for years, that knot is what
turns "change this module" into "rewrite the application".

::: tip The fix
Write the context map, as DDD asks: which context is upstream of which. Declare it in
`alveolus.config.ts`, and the code can no longer stray from it. A dependency that goes against
the map is reversed: `Ledger` publishes an event, `Payments` reacts.
:::

## What it checks

Every import from a file of one bounded context to a file of another, open host service or
composition root alike:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title">With a context map</span>The importing context lists the imported one in <code>contextMap</code>. The map itself is checked when the configuration loads: an unknown context or a cycle is an error.</div>
<div class="al-card"><span class="al-card-title">Without a context map</span>The imports observed form no cycle. An import that closes one is reported at both ends.</div>
</div>

Imports of the shared kernel are not consumptions: every context may import it.

## What it reports

```
src/ledger/driven/payments/adapters/payment-status.adapter.ts
  2  strategic/no-unmapped-context: ledger consumes payments, which the
     context map does not allow: add payments to contextMap.ledger, or
     reverse the dependency.
```

Without a map:

```
src/ledger/driven/payments/adapters/payment-status.adapter.ts
  2  strategic/no-unmapped-context: ledger consumes payments, which
     consumes ledger back: two contexts that depend on each other can
     no longer change alone; declare a contextMap and reverse one
     dependency.
```

## Fix it

### Declare the context map

So that the direction of every dependency is a decision, not an accident, list for each context
the ones it consumes:

```ts [alveolus.config.ts]
export default defineConfig({
	boundedContexts: { customers: "customers", ledger: "ledger", payments: "payments" },
	contextMap: {
		customers: [],
		ledger: ["customers"],
		payments: ["ledger", "customers"],
	},
	root: "src",
});
```

A context absent from the map consumes nothing.

### Reverse a dependency with an event

So that `Ledger` stays upstream, it does not ask `Payments` anything: it publishes
`TransferSettled` in its [published language](../../core/strategic/published-language.md), and
`Payments` reacts to it.

## Limits

::: warning What the rule cannot see
- A dependency that goes through the database, a queue or an HTTP call to another context's API
  written as a string: the map covers imports. In review, every consumption of another context
  is an import of its open host service.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "strategic/no-unmapped-context": "off" },
```

## See also

- [Open host services](../../core/strategic/open-host-services.md) and
  [Anti-corruption layers](../../core/strategic/anti-corruption-layers.md), how a context consumes another
- [`strategic/no-cross-context-import`](./no-cross-context-import.md), which keeps the open host
  service the only door
- Vaughn Vernon, *Domain-Driven Design Distilled*, chapter 4, "Strategic Design with Context Mapping"
- [Rules](../index.md), every rule by category
