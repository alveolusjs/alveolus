---
description: "Architecture checks for Domain-Driven Design in TypeScript: alveolus arch check reports every way a project drifts from its layers and bounded contexts."
---

# Rules

`alveolus arch check` applies rules that each report one way a project drifts: a shortcut between
bounded contexts, a framework leaking into the domain, a helper that lands nowhere in particular.

<dl class="al-glance">
	<dt>Command</dt><dd><code>npx alveolus arch check</code></dd>
	<dt>Rule names</dt><dd><a href="#how-rules-are-named"><code>&lt;category&gt;/no-&lt;what it reports&gt;</code></a></dd>
	<dt>Categories</dt><dd><a href="#strategic">Strategic</a>, <a href="#layers">Layers</a>, <a href="#tactical">Tactical</a></dd>
	<dt>Default</dt><dd>Every rule on; test files never checked</dd>
	<dt>Config</dt><dd><a href="#turn-a-rule-off"><code>rules</code></a> in <code>alveolus.config.ts</code></dd>
</dl>

## Why

A review catches what a reviewer looks at. The import that crosses a boundary, the class in the
wrong folder or the error thrown instead of returned slip through, one change at a time, and
coding agents make more changes than anyone reviews.

::: tip The fix
Each architecture decision becomes a rule that runs on every change. A violation says where, what
is wrong and what is allowed instead, so a developer or an agent can fix it without knowing the
whole architecture.
:::

## How rules are named

Every rule is named `<category>/no-<what it reports>`: the category says which part of the
architecture it guards, the rest says what a violation is.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><code>strategic/</code></span>Between bounded contexts: what may cross a boundary, and through which door.</div>
<div class="al-card"><span class="al-card-title"><code>layers/</code></span>Inside a bounded context: which layer may depend on which, and what each one may import.</div>
<div class="al-card"><span class="al-card-title"><code>tactical/</code></span>Inside the domain and the application: how building blocks are written and where they live.</div>
</div>

## Strategic

| Rule | Reports |
| --- | --- |
| [`strategic/no-cross-context-import`](./strategic/no-cross-context-import.md) | An import from another bounded context that is not its open host service. |

## Layers

| Rule | Reports |
| --- | --- |
| [`layers/no-impure-domain`](./layers/no-impure-domain.md) | The domain importing a framework, a database or another layer. |
| [`layers/no-outward-import`](./layers/no-outward-import.md) | A dependency pointing away from the domain, and a file outside the layers. |
| [`layers/no-portless-adapter`](./layers/no-portless-adapter.md) | A driven adapter that extends no port, a port declared outside the domain. |

## Tactical

| Rule | Reports |
| --- | --- |
| [`tactical/no-aggregate-reference`](./tactical/no-aggregate-reference.md) | An aggregate holding another aggregate instead of its identifier. |
| [`tactical/no-misplaced-class`](./tactical/no-misplaced-class.md) | A class in the wrong folder or file, two classes in one file. |
| [`tactical/no-mixed-handler`](./tactical/no-mixed-handler.md) | A command reading views, a query changing aggregates. |
| [`tactical/no-plain-class`](./tactical/no-plain-class.md) | A plain class, a free function or an enum in the domain or the application. |
| [`tactical/no-thrown-failure`](./tactical/no-thrown-failure.md) | A business failure thrown instead of returned. |

## Read a violation

Each violation gives the file and the line, the rule, what is wrong and what is allowed instead:

```
src/ordering/application/commands/place-order.command.ts:4
  layers/no-outward-import: The application layer imports
  src/ordering/driven/pg/adapters/mailer.adapter.ts (ordering driven):
  it may only import domain, application, published-language.
```

`--format json` gives the same information as JSON, with the symbol involved, for tools and
agents.

## Building blocks are recognised by inheritance

The rules know what a class is from what it extends: `class Order extends AggregateRoot` is an
aggregate, wherever it is and whatever its name. A class that extends one of your own base classes
counts too, as long as that base class extends a building block of `@alveolus/core`.

::: tip
There are no decorators or naming conventions to learn: the class says what it is, and the rules
take it at its word.
:::

## Turn a rule off

Every rule is on by default. Turn one off in `alveolus.config.ts`, with its full name:

```ts [alveolus.config.ts]
export default defineConfig({
	boundedContexts: { ordering: "ordering" },
	root: "src",
	rules: { "tactical/no-misplaced-class": "off" },
});
```

To adopt the rules on an existing project without turning them off, record the current violations
in a baseline: see [Getting started](../guide/getting-started.md#adopt-it-on-an-existing-project).

Test files (`*.spec.ts`, `*.test.ts`, `__tests__/`) are never checked.

## See also

- [Getting started](../guide/getting-started.md), to configure and run the checks
- [Project layout](../guide/project-layout.md), the layout the rules keep
