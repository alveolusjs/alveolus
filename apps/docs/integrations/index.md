# Integrations

Alveolus imposes no framework: only the composition root of each bounded context knows how its
classes are built, by hand or with a container.

<dl class="al-glance">
	<dt>Needs</dt><dd>No bus, no container, no ORM, no decorator</dd>
	<dt>Wired in</dt><dd>The <a href="/guide/project-layout#composition-root">composition root</a>, <code>ordering.module.ts</code></dd>
	<dt>Tokens</dt><dd>The abstract classes of ports and repositories</dd>
	<dt>Fits</dt><dd>Express, Fastify, Hono, plain Node.js, <a href="./nestjs">NestJS</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/layers/no-outward-import"><code>layers/no-outward-import</code></a>, <a href="/rules/layers/no-impure-domain"><code>layers/no-impure-domain</code></a></dd>
</dl>

## Why

A framework changes more often than the business rules. When a handler carries its decorators,
reads the request or imports the database client, moving to another framework, or just upgrading
it, means touching the use cases, and their tests need the framework to run.

::: tip The fix
The domain and the application import no framework. Every class receives its dependencies in its
constructor, typed with abstract classes. The framework stays at the edge: in the adapters, and in
the one file that builds everything.
:::

## How it works

The composition root builds the adapters and passes them to the handlers, which only know the
abstract classes they extend. Controllers, consumers and jobs then call the handlers.

<div class="al-diagram">
<svg viewBox="0 0 680 220" role="img" aria-label="The composition root ordering.module.ts builds the adapters PgOrders, SystemClock and RandomIdGenerator, and passes them to the constructor of PlaceOrderHandler, which knows them only as Orders, Clock and IdGenerator.">
	<defs>
		<marker id="wiring-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="82" width="170" height="56" rx="8" />
	<text class="label" x="93" y="106" text-anchor="middle">ordering.module.ts</text>
	<text class="note" x="93" y="126" text-anchor="middle">composition root</text>
	<rect class="box" x="250" y="16" width="190" height="56" rx="8" />
	<text class="label" x="345" y="40" text-anchor="middle">PgOrders</text>
	<text class="note" x="345" y="60" text-anchor="middle">extends Orders</text>
	<rect class="box" x="250" y="82" width="190" height="56" rx="8" />
	<text class="label" x="345" y="106" text-anchor="middle">SystemClock</text>
	<text class="note" x="345" y="126" text-anchor="middle">extends Clock</text>
	<rect class="box" x="250" y="148" width="190" height="56" rx="8" />
	<text class="label" x="345" y="172" text-anchor="middle">RandomIdGenerator</text>
	<text class="note" x="345" y="192" text-anchor="middle">extends IdGenerator</text>
	<rect class="box" x="500" y="82" width="172" height="56" rx="8" />
	<text class="label" x="586" y="106" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="586" y="126" text-anchor="middle">knows the abstractions</text>
	<path class="link" d="M 178 110 L 248 44" marker-end="url(#wiring-arrow)" />
	<path class="link" d="M 178 110 L 248 110" marker-end="url(#wiring-arrow)" />
	<path class="link" d="M 178 110 L 248 176" marker-end="url(#wiring-arrow)" />
	<text class="note" x="213" y="100" text-anchor="middle">new</text>
	<path class="link" d="M 440 44 L 498 106" marker-end="url(#wiring-arrow)" />
	<path class="link" d="M 440 110 L 498 110" marker-end="url(#wiring-arrow)" />
	<path class="link" d="M 440 176 L 498 114" marker-end="url(#wiring-arrow)" />
</svg>
</div>

There are two ways to write the composition root:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><a href="#without-a-container">Without a container</a></span>With Express, Fastify, Hono or plain Node.js: a class builds everything with <code>new</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="#with-a-container">With a container</a></span>With NestJS or another container: each adapter is registered under the abstract class it extends.</div>
</div>

## Without a container

The composition root is a plain class. Its constructor receives what comes from outside, such as
the database pool, and builds each handler with its adapters.

```ts [src/ordering/ordering.module.ts]
export class OrderingModule {
	readonly placeOrder: PlaceOrderHandler;

	constructor(db: Pool) {
		this.placeOrder = new PlaceOrderHandler(
			new PgOrders(db),
			new SystemClock(),
			new RandomIdGenerator(),
		);
	}
}
```

Routes, consumers and jobs then call `handle` and turn the `Result` into a response: see
[Command handlers](../core/application/command-handlers.md).

## With a container

The abstract classes of your ports and repositories are the injection tokens: register each
adapter under the class it extends, and the container passes it to every handler that asks for it.
No token constant, no string key.

::: tip
The [NestJS](./nestjs.md) guide shows the providers, the choice between factories and
`@Injectable()`, and how two modules connect.
:::

## See also

- [NestJS](./nestjs.md), the composition root as a NestJS module
- [Project layout](../guide/project-layout.md#composition-root), where the composition root lives
- [Command handlers](../core/application/command-handlers.md), the classes it builds
- Rules: [`layers/no-outward-import`](../rules/layers/no-outward-import.md), [`layers/no-impure-domain`](../rules/layers/no-impure-domain.md)
