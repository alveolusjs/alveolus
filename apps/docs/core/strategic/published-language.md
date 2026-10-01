# Published Language

The published language is the JSON that bounded contexts exchange: what a context exposes through
its open host services and events, and what another context reads from it. `PublishedLanguage<T>`
marks each of these types and checks, at compile time, that they are plain JSON.

```ts [src/catalog/published-language/product.representation.ts]
import type { PublishedLanguage } from "@alveolus/core";

export type ProductRepresentation = PublishedLanguage<{
	id: string;
	name: string;
	price: { amount: number; currency: string };
}>;
```

## When to use

Declare a representation for everything that crosses a bounded context, whatever the transport:
an HTTP response, a message on a broker, or the return value of a class called in the same process.
Inside a context, use the objects of the domain instead: aggregates, value objects, identifiers.

## Usage

### Expose a representation

The upstream context declares what it publishes in its own `published-language/` folder, one
representation per file. Its [open host service](./open-host-services.md) maps the domain to it.

```ts [src/catalog/published-language/product.representation.ts]
import type { PublishedLanguage } from "@alveolus/core";

export type ProductRepresentation = PublishedLanguage<{
	id: string;
	name: string;
	price: { amount: number; currency: string };
}>;
```

Identifiers become strings, value objects become plain objects, dates become ISO 8601 strings.

### Read another context

The downstream context declares, in its own `published-language/`, only the fields it reads. It
depends on the format, not on the code of the other context.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts]
import type { ProductRepresentation } from "../../../../catalog/published-language/product.representation";
```

```ts [✅ Prefer: src/ordering/published-language/catalog-product.representation.ts]
import type { PublishedLanguage } from "@alveolus/core";

export type CatalogProductRepresentation = PublishedLanguage<{
	id: string;
	price: { amount: number; currency: string };
}>;
```

</div>

::: details Why?
Importing the upstream type ties both contexts to one file: renaming a field the downstream never
reads still breaks it. A redeclared representation names what the downstream relies on, and
nothing more. When the open host service is called in the same process, TypeScript still checks
that both shapes match, in the [anti-corruption layer](./anti-corruption-layers.md) that reads it.
[`bc-isolation`](../../rules/bc-isolation.md) reports the import of another context's published
language.
:::

### Describe an event sent to other contexts

An [integration event](../application/integration-events.md) is a published-language type: the
emitter declares the events it publishes, with their name and payload.

```ts [src/ordering/published-language/order-placed.representation.ts]
import type { IntegrationEvent, PublishedLanguage } from "@alveolus/core";

export type OrderPlacedRepresentation = PublishedLanguage<
	IntegrationEvent<"OrderPlaced", { orderId: string; total: number; currency: string }>
>;
```

A consumer redeclares the event in its own published language, with the fields it reads:

```ts [src/billing/published-language/order-placed.representation.ts]
import type { IntegrationEvent, PublishedLanguage } from "@alveolus/core";

export type OrderPlacedRepresentation = PublishedLanguage<IntegrationEvent<"OrderPlaced", { orderId: string; total: number }>>;
```

### Validate what you receive

The type says what you expect, not what arrives. When the other context is reached over the
network, validate the JSON. The schema and the type it describes are one concept: keep them in the
same representation file.

```ts [src/ordering/published-language/catalog-product.representation.ts]
import type { PublishedLanguage } from "@alveolus/core";
import { z } from "zod";

export const catalogProductSchema = z.object({
	id: z.string(),
	price: z.object({ amount: z.number(), currency: z.string() }),
});

export type CatalogProductRepresentation = PublishedLanguage<z.infer<typeof catalogProductSchema>>;
```

A representation that fails validation is a broken contract, not a business failure: the
anti-corruption layer that reads it throws.

### Keep domain objects out

<div class="al-compare">

```ts [❌ Avoid]
export type OrderRepresentation = PublishedLanguage<{ id: OrderId; placedAt: Date; total: Money }>;
```

```ts [✅ Prefer]
export type OrderRepresentation = PublishedLanguage<{ id: string; placedAt: string; total: { amount: number; currency: string } }>;
```

</div>

The first one does not compile: `OrderId`, `Date` and `Money` are not JSON.

## Reference

```ts
type PublishedLanguage<Representation extends JsonValue> = Representation;

type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };
```

| Type parameter | Description |
| --- | --- |
| `Representation` | The JSON shape of what is exchanged. |

**Caveats**

- `PublishedLanguage` changes nothing at runtime: the type is the JSON type it wraps.
- Declare representations with `type`, not `interface`: an interface does not satisfy the index
  signature of `JsonValue`.
- Files in `published-language/` import only their own published language, the published-language
  types of core (`PublishedLanguage`, `JsonValue`, `IntegrationEvent`, `AnyIntegrationEvent`) and
  packages such as a schema library: see [`layer-direction`](../../rules/layer-direction.md).

Import from `@alveolus/core` or `@alveolus/core/published-language`.

## Troubleshooting

**`Type '…' does not satisfy the constraint 'JsonValue'`**: the representation holds something that
is not JSON (a `Date`, a class instance, a function), or it is declared with `interface`. Convert the
value to JSON, or declare the shape with `type`.

## See also

- [Open host services](./open-host-services.md), which answer in the published language
- [Anti-corruption layers](./anti-corruption-layers.md), which read it
- [Integration events](../application/integration-events.md), the events in the published language
- [`bc-isolation`](../../rules/bc-isolation.md)
