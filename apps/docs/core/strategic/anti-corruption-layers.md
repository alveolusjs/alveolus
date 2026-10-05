# Anti-corruption layers

An anti-corruption layer translates another bounded context into the language of yours, so that
the foreign model never enters your domain or your application. It is the adapter that touches the
other context, and the only one allowed to.

```ts [src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
export class CatalogPriceList extends PriceList implements AntiCorruptionLayer {
	async priceOf(productId: ProductId): Promise<Money | undefined> {
		const product: CatalogProductRepresentation | undefined = await this.catalog.productById(productId.value);
		return product === undefined ? undefined : this.toMoney(product.price);
	}
}
```

<div class="al-diagram">
<svg viewBox="0 0 680 250" role="img" aria-label="The catalog exposes CatalogApi, an open host service that answers with its published language. In ordering, CatalogPriceList, an anti-corruption layer, calls it, receives JSON and translates it into the objects of the PriceList port, declared by the ordering domain.">
	<defs>
		<marker id="acl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="8" width="256" height="234" rx="14" />
	<text class="note" x="24" y="32">src/catalog/</text>
	<rect class="box" x="28" y="50" width="216" height="58" rx="8" />
	<text class="label" x="136" y="74" text-anchor="middle">CatalogApi</text>
	<text class="note" x="136" y="94" text-anchor="middle">OpenHostService</text>
	<rect class="box" x="28" y="150" width="216" height="58" rx="8" />
	<text class="label" x="136" y="174" text-anchor="middle">ProductRepresentation</text>
	<text class="note" x="136" y="194" text-anchor="middle">published-language/</text>
	<rect class="boundary" x="344" y="8" width="328" height="234" rx="14" />
	<text class="note" x="360" y="32">src/ordering/</text>
	<rect class="box" x="364" y="50" width="288" height="58" rx="8" />
	<text class="label" x="508" y="74" text-anchor="middle">CatalogPriceList</text>
	<text class="note" x="508" y="94" text-anchor="middle">AntiCorruptionLayer · translates</text>
	<rect class="box" x="364" y="150" width="288" height="58" rx="8" />
	<text class="label" x="508" y="174" text-anchor="middle">PriceList</text>
	<text class="note" x="508" y="194" text-anchor="middle">domain/ports/ · Money</text>
	<path class="link" d="M 364 68 L 246 68" marker-end="url(#acl-arrow)" />
	<text class="note" x="305" y="60" text-anchor="middle">calls</text>
	<path class="link" d="M 244 92 L 362 92" marker-end="url(#acl-arrow)" />
	<text class="note" x="303" y="110" text-anchor="middle">JSON</text>
	<path class="link" d="M 136 108 L 136 148" marker-end="url(#acl-arrow)" />
	<path class="link" d="M 508 108 L 508 148" marker-end="url(#acl-arrow)" />
	<text class="note" x="516" y="132">extends</text>
</svg>
</div>

## When to use

Write one on every adapter that reads another bounded context:

- a **driven** adapter, when your application needs something from the other context, such as a
  price from the catalog;
- a **driving** adapter, when the other context sends you something, such as an `OrderPlaced`
  event.

## Usage

### Declare what your context needs

The domain states the need in its own words, as a [port](../domain/ports.md). Nothing in it
mentions the catalog.

```ts [src/ordering/domain/ports/price-list.port.ts]
import { Port } from "@alveolus/core";

import type { Money } from "../../../shared-kernel/domain/value-objects/money.value-object";
import type { ProductId } from "../value-objects/product-id.identifier";

export abstract class PriceList extends Port {
	abstract priceOf(productId: ProductId): Promise<Money | undefined>;
}
```

### Translate in a driven adapter

The adapter extends the port and implements `AntiCorruptionLayer`. It lives under the name of the
context it calls, `driven/catalog/adapters/`. It reads the representation your context declares,
and returns your objects.

```ts [src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
import type { AntiCorruptionLayer } from "@alveolus/core";

import { CatalogApi } from "../../../../catalog/driving/in-process/catalog-api";
import { Money } from "../../../../shared-kernel/domain/value-objects/money.value-object";
import { PriceList } from "../../../domain/ports/price-list.port";
import type { ProductId } from "../../../domain/value-objects/product-id.identifier";
import type { CatalogProductRepresentation } from "../../../published-language/catalog-product.representation";

export class CatalogPriceList extends PriceList implements AntiCorruptionLayer {
	constructor(private readonly catalog: CatalogApi) {
		super();
	}

	async priceOf(productId: ProductId): Promise<Money | undefined> {
		const product: CatalogProductRepresentation | undefined = await this.catalog.productById(productId.value);
		if (product === undefined) {
			return undefined;
		}
		const price = Money.of(product.price.amount, product.price.currency);
		if (!price.ok) {
			throw new Error(`The catalog sent an invalid price: ${price.error.type}`);
		}
		return price.value;
	}
}
```

Typing the answer with your own `CatalogProductRepresentation` makes TypeScript check that the
catalog still sends the fields you read. If it moves behind HTTP, only this adapter changes: it
fetches and validates the JSON instead of calling `CatalogApi`.

### Translate in a driving adapter

When the other context sends you a message, the anti-corruption layer is the consumer, in
`driving/`. It turns the event into one of your commands.

```ts [src/billing/driving/rabbitmq/consumers/order-placed.consumer.ts]
import type { AntiCorruptionLayer } from "@alveolus/core";

import { OpenInvoiceHandler } from "../../../application/commands/open-invoice.command";
import type { OrderPlacedRepresentation } from "../../../published-language/order-placed.representation";

export class OrderPlacedConsumer implements AntiCorruptionLayer {
	constructor(private readonly openInvoice: OpenInvoiceHandler) {}

	async consume(event: OrderPlacedRepresentation): Promise<void> {
		const opened = await this.openInvoice.handle({ amount: event.payload.total, orderId: event.payload.orderId });
		if (!opened.ok) {
			throw new Error(`Cannot open the invoice of order ${event.payload.orderId}: ${opened.error.type}`);
		}
	}
}
```

Events are delivered at least once: ignore an event whose `id` you have already handled.

### Keep the other model at the edge

<div class="al-compare">

```ts [❌ Avoid: src/ordering/application/commands/place-order.command.ts]
import { CatalogApi } from "../../../catalog/driving/in-process/catalog-api";
```

```ts [✅ Prefer: src/ordering/application/commands/place-order.command.ts]
import { PriceList } from "../../domain/ports/price-list.port";
```

</div>

::: details Why?
Once the application calls the catalog directly, its representations spread into use cases and
then into the domain, and every change in the catalog becomes a change in ordering. With the
anti-corruption layer, representations come in through one class and never go further: what leaves
it are your own objects. [`bc-isolation`](../../rules/bc-isolation.md) reports any import of
another context outside an anti-corruption layer or the composition root.
:::

## Reference

```ts
abstract class AntiCorruptionLayer
```

`AntiCorruptionLayer` has no members. Apply it with `implements`, because a driven anti-corruption
layer already extends its port: it marks the class as the translator of another bounded context.

**Caveats**

- Representations come in, never go out: the public methods return your objects.
- Name the port after your language (`PriceList`), not after the other context (`CatalogClient`).
- An answer that breaks the published language is a technical failure: throw, do not return a
  domain error.
- A driven anti-corruption layer is placed like any adapter, in `driven/<context>/adapters/`; a
  consumer goes in `driving/`: see [`placement`](../../rules/placement.md).

Import from `@alveolus/core` or `@alveolus/core/anti-corruption-layers`.

## See also

- [Open host services](./open-host-services.md), what a driven anti-corruption layer calls
- [Published Language](./published-language.md), what it reads
- [Ports](../domain/ports.md), what a driven anti-corruption layer extends
- [`bc-isolation`](../../rules/bc-isolation.md)
