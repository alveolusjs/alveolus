---
description: "Domain errors in TypeScript: expected business failures returned as values in a Result instead of thrown exceptions, visible in every signature."
---

# Domain errors

A domain error is an expected business failure, such as an order placed twice, returned as a value
instead of thrown.

<dl class="al-glance">
	<dt>Layer</dt><dd>Domain</dd>
	<dt>File</dt><dd><code>domain/errors/order-already-placed.error.ts</code></dd>
	<dt>Extends</dt><dd><a href="#api"><code>DomainError&lt;Payload&gt;</code></a></dd>
	<dt>Returned by</dt><dd><a href="/core/domain/aggregates">Aggregates</a>, <a href="/core/domain/entities">entities</a>, <a href="/core/domain/value-objects">value objects</a>, <a href="/core/application/command-handlers">command handlers</a></dd>
	<dt>Checked by</dt><dd><a href="/rules/tactical/no-thrown-failure"><code>tactical/no-thrown-failure</code></a>, <a href="/rules/tactical/no-loose-code"><code>tactical/no-loose-code</code></a>, <a href="/rules/tactical/no-misplaced-class"><code>tactical/no-misplaced-class</code></a></dd>
</dl>

## Why

`Order.place` throws when the order is empty. Nothing in its signature says so. The handler forgets
a `try`, the controller too, and a customer who clicks "Place" on an empty cart gets a 500 instead
of a clear message.

::: tip The fix
`place` returns `Result<void, OrderAlreadyPlaced | EmptyOrder>`. Every caller sees in the signature
what can go wrong, and the compiler makes it handle the failure before it reads the value.
:::

## How it works

A domain error is a small class, not an `Error`: no stack trace, never thrown. It travels inside a
[`Result`](../utilities/result.md), from the method that refuses to the edge that answers.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Declare it</span>One class per way the rules can refuse an operation, with the data that explains it.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Return it</span>The business method returns <code>err(new EmptyOrder())</code>. Nothing changes.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Answer it at the edge</span>The handler passes it through unchanged; the controller turns it into a response.</div>
</div>

```ts
if (this.lines.length === 0) {
	return err(new EmptyOrder());
}
```

## Where it fits

<div class="al-diagram">
<svg viewBox="0 0 680 120" role="img" aria-label="Order.place returns an EmptyOrder error. The command handler returns it unchanged, and the controller turns it into an HTTP 422 response.">
	<defs>
		<marker id="domain-error-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="32" width="200" height="56" rx="8" />
	<text class="label" x="108" y="56" text-anchor="middle">Order.place()</text>
	<text class="note" x="108" y="76" text-anchor="middle">err(new EmptyOrder())</text>
	<path class="link" d="M 208 60 L 238 60" marker-end="url(#domain-error-flow-arrow)" />
	<rect class="box" x="240" y="32" width="200" height="56" rx="8" />
	<text class="label" x="340" y="56" text-anchor="middle">PlaceOrderHandler</text>
	<text class="note" x="340" y="76" text-anchor="middle">returns it unchanged</text>
	<path class="link" d="M 440 60 L 470 60" marker-end="url(#domain-error-flow-arrow)" />
	<rect class="box" x="472" y="32" width="200" height="56" rx="8" />
	<text class="label" x="572" y="56" text-anchor="middle">Controller</text>
	<text class="note" x="572" y="76" text-anchor="middle">422 { error: "EmptyOrder" }</text>
</svg>
</div>

::: tip
Domain errors become HTTP errors in the driving adapter, and nowhere else. The domain and the
application never know about status codes.
:::

## API

```ts
import { DomainError } from "@alveolus/core";
// or: import { DomainError } from "@alveolus/core/domain-errors";
```

### Type parameters

```ts
abstract class DomainError<Payload = undefined> { … }
```

| Parameter | What it is | Constraint |
| --- | --- | --- |
| `Payload` | The data describing the failure. | any; `undefined` by default: no data |

`AnyDomainError` is the type of any domain error; handlers only accept errors of this type.

### `constructor(payload)` <Badge type="tip" text="you call it" />

```ts
constructor(
	...[payload]: Payload extends undefined
		? []
		: [payload: Payload]
)
```

Creates the error. Without a `Payload`, it takes no argument: `new EmptyOrder()`. With one, the
payload is required: `new InvalidQuantity({ quantity })`. An error has no body: declare the class
only.

```ts
class EmptyOrder extends DomainError {}
class InvalidQuantity extends DomainError<{ readonly quantity: number }> {}
```

### `payload` <Badge type="info" text="readonly" /> <Badge type="tip" text="read at the edge" />

```ts
readonly payload: Payload
```

The data of the failure, `undefined` for an error without data.

### `type` <Badge type="info" text="getter" /> <Badge type="tip" text="read at the edge" />

```ts
get type(): string
```

The class name, such as `"EmptyOrder"`: what a driving adapter puts in its response.

::: warning Caveats
- `type` is the class name: a bundler that minifies class names changes it. Keep class names in
  your build (`keep_classnames` in Terser, `keepNames` in esbuild), or narrow with `instanceof`.
- A `DomainError` does not extend `Error`. In the domain and the application, `class X extends
  Error` is reported by [`tactical/no-loose-code`](../../rules/tactical/no-loose-code.md), and
  nothing is thrown there ([`tactical/no-thrown-failure`](../../rules/tactical/no-thrown-failure.md)):
  only adapters throw, for technical failures.
:::

## Usage

Build `InvalidQuantity`, a failure of the `Order` aggregate, from its class to the response it
becomes. Each step shows the whole file it changes: added lines are highlighted, replaced lines are struck out.

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span><a href="#_1-declare-the-failure">Declare the failure</a></span>One class per failure.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span><a href="#_2-carry-what-the-caller-needs">Carry what the caller needs</a></span>A typed payload.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span><a href="#_3-return-it-in-a-result">Return it in a Result</a></span>Never thrown.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span><a href="#_4-turn-it-into-a-response">Turn it into a response</a></span>At the edge only.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">5</span><a href="#_5-check-it">Check it</a></span>Let the rules keep it that way.</div>
</div>

### 1. Declare the failure

So that a caller can tell this failure from any other, it is a class of its own, named after what
went wrong, in its own file.

```ts [src/ordering/domain/errors/invalid-quantity.error.ts]
import { DomainError } from "@alveolus/core";

export class InvalidQuantity extends DomainError {}
```

Without a type parameter, the error carries no data: `new InvalidQuantity()` takes no argument.

### 2. Carry what the caller needs

The caller must be able to explain the failure: the payload holds the data, read-only, and becomes
required by the constructor.

```ts [src/ordering/domain/errors/invalid-quantity.error.ts]
import { DomainError } from "@alveolus/core";

export class InvalidQuantity extends DomainError {} // [!code --]
export class InvalidQuantity extends DomainError<{ // [!code ++]
	readonly quantity: number; // [!code ++]
}> {} // [!code ++]
```

A failure with nothing to explain keeps no payload:

```ts [src/ordering/domain/errors/empty-order.error.ts]
import { DomainError } from "@alveolus/core";

export class EmptyOrder extends DomainError {}
```

### 3. Return it in a Result

So that every caller sees the failure in the signature, the domain returns the error in a
[`Result`](../utilities/result.md), and never throws it. Nothing changes when it is returned.

```ts [src/ordering/domain/entities/order-line.entity.ts]
changeQuantity(quantity: number): Result<void, InvalidQuantity> {
	if (quantity <= 0) {
		return err(new InvalidQuantity({ quantity }));
	}
	this.currentQuantity = quantity;
	return ok();
}
```

### 4. Turn it into a response

Only the edge knows about HTTP: the driving adapter narrows the union with `instanceof`, reads
`type` and `payload`, and chooses the status.

```ts [src/ordering/driving/http/controllers/orders.controller.ts]
if (!placed.ok) {
	const body = {
		error: placed.error.type,
		details: placed.error.payload,
	};
	if (placed.error instanceof OrderNotFound) {
		return { status: 404, body };
	}
	return { status: 422, body };
}
```

### 5. Check it

Run the checks. Three rules keep the error the way it is now:

```sh
npx alveolus arch check
```

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-thrown-failure"><code>no-thrown-failure</code></a></span>Nothing throws a <code>DomainError</code>: it is returned in a <code>Result</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-loose-code"><code>no-loose-code</code></a></span>It extends <code>DomainError</code>, not <code>Error</code>.</div>
<div class="al-card"><span class="al-card-title"><a href="../../rules/tactical/no-misplaced-class"><code>no-misplaced-class</code></a></span>It stays alone in <code>domain/errors/*.error.ts</code>.</div>
</div>

A thrown error is reported:

```
src/ordering/domain/entities/order-line.entity.ts
  41  error  tactical/no-thrown-failure: A failure is thrown: return it in a
  Result instead.
```

## Troubleshooting

**`Expected 0 arguments, but got 1`** or **`Expected 1 arguments, but got 0`**: the arguments do
not match the payload type. An error declared without a type parameter takes no argument; one
declared with a payload requires it.

## See also

- [Result](../utilities/result.md), how errors are returned and combined
- [Aggregates](./aggregates.md), [Entities](./entities.md) and [Value objects](./value-objects.md), which return them
- [Command handlers](../application/command-handlers.md), which declare them
- Rules: [`tactical/no-thrown-failure`](../../rules/tactical/no-thrown-failure.md), [`tactical/no-loose-code`](../../rules/tactical/no-loose-code.md), [`tactical/no-misplaced-class`](../../rules/tactical/no-misplaced-class.md)
