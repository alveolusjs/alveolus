# Rules

`alveolus arch check` applies nine rules. Each one guards against a way a project drifts over
time: a shortcut between bounded contexts, a framework leaking into the domain, a helper that
lands nowhere in particular. It does not check everything, only what keeps the architecture
standing.

| Rule | Guards against |
| --- | --- |
| [`bc-isolation`](./bc-isolation.md) | Bounded contexts reaching into each other. |
| [`domain-purity`](./domain-purity.md) | The domain depending on frameworks, databases or other layers. |
| [`layer-direction`](./layer-direction.md) | Dependencies pointing outwards, and files outside the layers. |
| [`driven-adapters-extend-port`](./driven-adapters-extend-port.md) | Adapters that implement no port, ports declared outside the domain. |
| [`building-blocks-only`](./building-blocks-only.md) | Plain classes, free functions and enums in the domain and the application. |
| [`placement`](./placement.md) | Classes in the wrong folder or file. |
| [`reference-by-identity`](./reference-by-identity.md) | An aggregate holding another aggregate. |
| [`command-query-separation`](./command-query-separation.md) | Commands that read views, queries that write. |
| [`errors-as-values`](./errors-as-values.md) | Business failures thrown instead of returned. |

## Read a violation

Each violation gives the file and the line, the rule, what is wrong and what is allowed instead:

```
src/ordering/application/commands/place-order.command.ts:4
  layer-direction: The application layer imports src/ordering/driven/pg/adapters/mailer.adapter.ts (ordering driven): it may only import domain, application, published-language.
```

`--format json` gives the same information as JSON, with the symbol involved, for tools and
agents.

## Building blocks are recognised by inheritance

The rules know what a class is from what it extends: `class Order extends AggregateRoot` is an
aggregate, wherever it is and whatever its name. A class that extends one of your own base classes
counts too, as long as that base class extends a building block of `@alveolus/core`. That is why
there are no decorators or naming conventions to learn: the class says what it is.

## Turn a rule off

Every rule is on by default. Turn one off in `alveolus.config.ts`:

```ts [alveolus.config.ts]
export default defineConfig({
	boundedContexts: { ordering: "ordering" },
	root: "src",
	rules: { placement: "off" },
});
```

To adopt the rules on an existing project without turning them off, record the current violations
in a baseline: see [Getting started](../guide/getting-started.md#adopt-it-on-an-existing-project).

Test files (`*.spec.ts`, `*.test.ts`, `__tests__/`) are never checked.
