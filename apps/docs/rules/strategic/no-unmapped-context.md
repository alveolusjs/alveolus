---
description: "Architecture rule: a bounded context consumes only the contexts its context map declares, and two contexts never depend on each other."
---

# no-unmapped-context

A bounded context consumes the contexts its context map declares, and nothing else: two contexts
never depend on each other.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>strategic/no-unmapped-context</code></dd>
	<dt>Category</dt><dd><a href="/rules/#strategic">Strategic</a>: what crosses a bounded context</dd>
	<dt>Reports</dt><dd>An import of another context, or a value of another context given in the wiring, that <code>contextMap</code> does not allow</dd>
	<dt>Applies to</dt><dd>Every file of every bounded context; for the wiring, the composition roots and the files at the root of <code>src/</code></dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"strategic/no-unmapped-context": "off"</code></a></dd>
</dl>

## Why

`Payments` reads balances from `Ledger`, through its open host service, as it should. A year
later `Ledger` asks `Payments` whether a transfer is pending, through *its* open host service.
Each import is clean on its own; together they tie the two contexts: neither can be deployed,
extracted or rewritten without the other. In a system that lives for years, that knot is what
turns "change this module" into "rewrite the application".

::: tip The fix
Write the context map, as DDD asks: which context is upstream of which. `alveolus.config.ts`
requires it, so the code can no longer stray from it. A dependency that goes against the map is
reversed: `Ledger` publishes an event, `Payments` reacts. Adding a line to the map is the other
way out, and it is a strategic decision: take it in a review, not in a fix.
:::

## What it checks

Every import from a file of one bounded context to a file of another, open host service or
composition root alike: the importing context lists the imported one under `consumes` in
`contextMap`.

The map itself is checked when the configuration loads, before any rule runs: a context left out
of the map, a context the map names that `boundedContexts` does not declare, a context that
consumes itself, or a cycle, is an error. Two contexts that depend on each other are therefore
never allowed, whichever way the code is written.

Imports of the shared kernel are not consumptions: every context may import it.

### The wiring counts too

A context can consume another one without importing it: `app.module.ts` sees every module, and
can hand a value of one context to another. Ledger declares a port, its adapter calls whatever it
is given, and the root composition gives it a handler of payments:

```ts [src/app.module.ts]
this.ledger = new LedgerModule({
	transfers: () => this.payments.commands.settleTransfer,
});
```

No file of ledger imports payments, yet ledger now consumes it. In the composition roots and the
files at the root of `src/`, every value given to a class, a function or a field of one context
(an argument, a property of an object, the body of an arrow function, an assignment, a variable
typed by that context) is read: when it comes from another context, by where it is declared or by
its type, the receiving context consumes that one, and the map must say so. A module handed whole,
such as `new PaymentsModule(this.ledger)`, is not a consumption yet: what that module then takes
from it is.

## What it reports

```
src/ledger/driven/payments/adapters/payment-status.adapter.ts
  2  error  strategic/no-unmapped-context: ledger consumes payments, which the
     context map does not allow: reverse the dependency with an
     integration event that ledger publishes and payments subscribes to,
     not with a callback; or if ledger really is downstream of payments,
     add payments to contextMap.ledger.consumes.

src/app.module.ts
 14  error  strategic/no-unmapped-context: ledger receives
     this.payments.commands.settleTransfer from payments here, which the
     context map does not allow: reverse the dependency with an
     integration event that ledger publishes and payments subscribes to,
     not with a callback; or if ledger really is downstream of payments,
     add payments to contextMap.ledger.consumes.
```

A map that would allow it is refused before the check:

```
Invalid configuration in alveolus.config.ts:
contextMap has a cycle: ledger → payments → ledger. Two contexts that depend
on each other can no longer change alone: reverse one dependency.
```

## Fix it

### Declare the context map

So that the direction of every dependency is a decision, not an accident, list for each context
the ones it consumes. Each line reads as a sentence: `payments` consumes `ledger` and `customers`.

```ts [alveolus.config.ts]
export default defineConfig({
	boundedContexts: { customers: "customers", ledger: "ledger", payments: "payments" },
	contextMap: {
		customers: { consumes: [] },
		ledger: { consumes: ["customers"] },
		payments: { consumes: ["ledger", "customers"] },
	},
	root: "src",
	subdomains: { core: ["ledger", "payments"], generic: ["customers"] },
});
```

Every context is in the map. `consumes: []` is a decision too: that context goes its separate
way, and the day it needs another one, the import is reported and the map is updated on purpose.

### Reverse a dependency with an event

So that `Ledger` stays upstream, it does not ask `Payments` anything: it publishes
`TransferSettled` in its [published language](../../core/strategic/published-language.md), and
`Payments` reacts to it.

A callback is not a reversal. `Ledger` calling a function that `Payments` registered on its open
host service still runs code of `Payments` when `Ledger` decides: the dependency is the same, only
hidden from the map. An event carries data, and `Ledger` does not know who reacts.

## Limits

::: warning What the rule cannot see
- A dependency that goes through the database, a queue or an HTTP call to another context's API
  written as a string: the map covers imports and the wiring. In review, every consumption of
  another context is an import of its open host service.
- A value whose type is erased on the way: a cast (`as unknown as Handler`, `any`) in the
  composition root, or a container token written as a string, such as NestJS
  `{ provide: "transfers", useFactory: … }`. In review, the composition root holds no cast, and
  a token is the abstract class of a port.
- With the rule off, the wiring is no longer checked against the map, even though
  [`strategic/no-cross-context-import`](./no-cross-context-import.md) still checks what crosses.
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
