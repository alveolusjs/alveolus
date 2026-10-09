---
description: "Architecture rule: the shared kernel shares a model, not state; a static field that holds state would let two contexts talk where the context map does not show it."
---

# no-shared-state

The shared kernel shares a model, never state. A static field that the code can change is reached
by every context at once: a channel between them that no import and no context map shows.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>strategic/no-shared-state</code></dd>
	<dt>Category</dt><dd><a href="/rules/#strategic">Strategic</a>: what crosses a bounded context</dd>
	<dt>Reports</dt><dd>A static field of the shared kernel without <code>readonly</code>, or holding a collection</dd>
	<dt>Applies to</dt><dd>Every class of the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"strategic/no-shared-state": "off"</code></a></dd>
</dl>

## Why

The catalog needs to cancel the orders of a withdrawn product, and the context map says the
catalog consumes nothing. Someone adds a `ServiceRegistry` to the shared kernel: ordering registers
its handler under a name, the catalog resolves it. No file of the catalog imports ordering, every
import rule passes, and the catalog now depends on ordering in a way nobody decided.

::: tip The fix
Contexts talk through an [open host service](../../core/strategic/open-host-services.md), consumed
in an [anti-corruption layer](../../core/strategic/anti-corruption-layers.md), and the
[context map](./no-unmapped-context.md) says who consumes whom. The shared kernel holds what both
contexts mean the same way: value objects, identifiers, ports. Constants are fine; a place to put
things is not.
:::

## What it checks

Every static field of a class in the shared kernel:

| Static field | Allowed |
| --- | --- |
| `static readonly ZERO = new Money({ amount: 0 })` | ✅ |
| `static readonly PRECISION = 2` | ✅ |
| `static readonly CURRENCIES: readonly string[] = ["EUR"]`, a `ReadonlyMap`, a `ReadonlySet` | ✅ |
| `static readonly NONE = new CustomerId("")`: an identifier | ✅ |
| `static readonly RATE = new Decimal("1.1")`: a class of a package listed in `domainDependencies` | ✅ |
| `static count = 0`: without `readonly` | ❌ |
| `static readonly services = new Map()`: a `Map`, a `Set`, a `WeakMap`, a `WeakSet` | ❌ |
| `static readonly names: string[] = []`: an array that is not `readonly` | ❌ |
| `static readonly byId: Record<string, Handler> = {}`: an index signature | ❌ |
| `static readonly options = { strict: true }`: an object literal | ❌ |
| `static readonly shared = new ServiceDirectory()`: a class that is not a value, such as a singleton | ❌ |
| `static readonly bus = new EventEmitter()`: a class of a package outside `domainDependencies` | ❌ |
| `static readonly resolve = makeResolver()`: a function, which can close over any state | ❌ |

A static field holds a value: a primitive, a value object, an identifier, a class of a package
listed in `domainDependencies`, or a `readonly` collection of them. Static methods are not fields:
`static of(amount: number)` is fine.

Instance fields are not checked: an adapter of the shared kernel may hold its own state. When each
context builds its own instance, nobody else reaches it; when the composition root at the root of
`src/` hands the same instance to two contexts, it is a channel, see [Limits](#limits).

Module-level state, such as `let current` or `const services = new Map()` at the top of a file, is
reported by [`tactical/no-loose-code`](../tactical/no-loose-code.md).

## What it reports

```
src/shared-kernel/driven/memory/registry/service-registry.ts
  2  error  strategic/no-shared-state: ServiceRegistry.services holds a
     collection in a static field: every context reaches the same one, a
     channel the context map does not show. The shared kernel shares a
     model, not state: integrate through an open host service.
  3  error  strategic/no-shared-state: ServiceRegistry.shared holds a
     ServiceRegistry in a static field, which can keep state every context
     reaches, a channel the context map does not show. A static field of
     the shared kernel holds a value: a primitive, a value object, an
     identifier, a class of domainDependencies, or a readonly collection
     of them.
```

## Fix it

### Integrate through an open host service

So that the dependency is decided and visible, the upstream context exposes an open host service,
the downstream context adds it to `contextMap.<downstream>.consumes` and calls it from an
anti-corruption layer. The composition root passes the service; no registry is needed.

### Keep a constant constant

So that a constant cannot become a channel, make it `readonly` and give it an immutable type: a
value object, a primitive, a `readonly` array, a `ReadonlyMap`.

### Build services in the composition root

So that every context gets the instance the composition root decides, a clock, a bus or a
directory is built there and passed to the constructors that need it, not kept in a static
`instance` field.

## Limits

::: warning What the rule cannot see
- A value object or a class of `domainDependencies` is trusted to be immutable: a value object
  that keeps a `Map` in a private field passes. In review, a value object changes by returning a
  new one.
- A `Readonly<Record<…>>` counts as a collection, because it has an index signature: use a
  `ReadonlyMap` for a constant dictionary.
- An instance handed to two contexts by the composition root at the root of `src/` is not checked:
  the database and the outbox are shared that way on purpose, and a registry passed the same way
  goes unseen. In review, the root passes the same instance to several contexts only for the
  infrastructure every context needs: the database, the outbox, the clock.
- State held outside the shared kernel is not checked: a package with a global container, such as
  the default container of a dependency injection library. A name of `globalThis` that no file
  declares is reported by [`strategic/no-cross-context-import`](./no-cross-context-import.md).
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "strategic/no-shared-state": "off" },
```

## See also

- [`strategic/no-fat-shared-kernel`](./no-fat-shared-kernel.md), what the shared kernel holds
- [`strategic/no-unmapped-context`](./no-unmapped-context.md), the relations between contexts
- [Rules](../index.md), every rule by category
