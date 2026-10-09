<p align="center">
	<img src="apps/docs/public/logo.svg" alt="Alveolus" width="96" />
</p>

<h1 align="center">Alveolus</h1>

<p align="center">
	Domain-Driven Design building blocks for TypeScript, and the checks that keep them in place.
</p>

<p align="center">
	<a href="https://alveolus.dev/">Documentation</a> ·
	<a href="https://alveolus.dev/guide/getting-started">Getting started</a> ·
	<a href="https://alveolus.dev/rules/">Rules</a>
</p>

---

Architectures drift: deadlines, new teammates and coding agents erode the structure a project
started with. Alveolus turns those decisions into code. The patterns of DDD become classes you
extend, and a check run in CI reports what breaks them.

| Package          | Description                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `@alveolus/core` | The building blocks: aggregates, entities, value objects, events, ports, handlers, outbox, Result. No runtime dependency. |
| `@alveolus/arch` | The architecture checks: rules that keep bounded contexts closed, the domain pure and every class in its place. |

> [!WARNING]
> Alveolus is at `0.x`: a minor version may still rename a rule or a configuration key, and the changelog says what to do. See [Versioning](https://alveolus.dev/guide/versioning).

## Quick start

```sh
pnpm add @alveolus/core
pnpm add -D @alveolus/arch
```

Write the domain with building blocks:

```ts
import { AggregateRoot, err, ok, type Result } from "@alveolus/core";

export class Order extends AggregateRoot<OrderId, OrderPlaced, OrderSnapshot> {
	place(total: number, eventId: string, now: Date): Result<void, InvalidTotal> {
		if (total <= 0) {
			return err(new InvalidTotal({ total }));
		}
		this.placedTotal = total;
		this.record(new OrderPlaced({ aggregateId: this.id, id: eventId, occurredAt: now, payload: { total } }));
		return ok();
	}
}
```

Describe your bounded contexts in `alveolus.config.ts`:

```ts
import { defineConfig } from "@alveolus/arch";

export default defineConfig({
	boundedContexts: { catalog: "catalog", ordering: "ordering" },
	contextMap: { catalog: { consumes: [] }, ordering: { consumes: ["catalog"] } },
	root: "src",
	subdomains: { core: ["catalog", "ordering"] },
});
```

Check it on every run:

```sh
npx alveolus arch check
```

See the [documentation](https://alveolus.dev/) for every building block and rule.

## Contributing

Requires Node.js 24+ and pnpm.

```sh
pnpm install
pnpm check      # lint, typecheck, knip, tests
pnpm docs:dev   # run the documentation locally
```

## License

[MIT](https://opensource.org/licenses/MIT)
