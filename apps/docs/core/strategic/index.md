---
description: "Strategic Domain-Driven Design in TypeScript: split a system into bounded contexts and decide how they talk without sharing their models."
---

# Strategic

Strategic design splits a system into bounded contexts, each with its own model, and decides how
they talk without sharing that model.

## Why

The catalog knows a product by its name, photos and stock. Ordering only needs its price. If
ordering imports the catalog's `Product` class, every change in the catalog breaks ordering, and
the two teams can no longer move alone.

::: tip The fix
Each context keeps its model to itself. They exchange plain JSON through a documented entry point,
and each side translates it into its own words.
:::

## How the contexts meet

<div class="al-diagram">
<svg viewBox="0 0 720 260" role="img" aria-label="In ordering, AddLineHandler asks the PriceList port for a price. CatalogPriceList, the anti-corruption layer, extends the port and reads the JSON of the published language, answered by CatalogApi, the open host service of catalog, which calls GetProductHandler.">
	<defs>
		<marker id="strategic-overview-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path class="arrow" d="M 0 0 L 10 5 L 0 10 z" />
		</marker>
	</defs>
	<rect class="boundary" x="8" y="8" width="272" height="244" rx="14" />
	<text class="note" x="24" y="30">src/ordering/ · a context</text>
	<rect class="box" x="24" y="44" width="240" height="48" rx="8" />
	<text class="label" x="144" y="64" text-anchor="middle">AddLineHandler</text>
	<text class="note" x="144" y="82" text-anchor="middle">asks for a price</text>
	<rect class="box" x="24" y="116" width="240" height="48" rx="8" />
	<text class="label" x="144" y="136" text-anchor="middle">PriceList</text>
	<text class="note" x="144" y="154" text-anchor="middle">port · in your words</text>
	<rect class="box" x="24" y="188" width="240" height="48" rx="8" />
	<text class="label" x="144" y="208" text-anchor="middle">CatalogPriceList</text>
	<text class="note" x="144" y="226" text-anchor="middle">anti-corruption layer</text>
	<path class="link" d="M 144 92 L 144 114" marker-end="url(#strategic-overview-arrow)" />
	<path class="link" d="M 144 188 L 144 166" marker-end="url(#strategic-overview-arrow)" />
	<text class="note" x="154" y="181">extends</text>
	<rect class="box" x="300" y="188" width="156" height="48" rx="8" />
	<text class="label" x="378" y="208" text-anchor="middle">JSON</text>
	<text class="note" x="378" y="226" text-anchor="middle">published language</text>
	<path class="link" d="M 300 212 L 266 212" marker-end="url(#strategic-overview-arrow)" />
	<path class="link" d="M 492 212 L 458 212" marker-end="url(#strategic-overview-arrow)" />
	<rect class="boundary" x="476" y="8" width="236" height="244" rx="14" />
	<text class="note" x="492" y="30">src/catalog/ · a context</text>
	<rect class="box" x="492" y="44" width="204" height="48" rx="8" />
	<text class="label" x="594" y="64" text-anchor="middle">GetProductHandler</text>
	<text class="note" x="594" y="82" text-anchor="middle">reads the catalog</text>
	<rect class="box" x="492" y="188" width="204" height="48" rx="8" />
	<text class="label" x="594" y="208" text-anchor="middle">CatalogApi</text>
	<text class="note" x="594" y="226" text-anchor="middle">open host service</text>
	<path class="link" d="M 594 188 L 594 94" marker-end="url(#strategic-overview-arrow)" />
	<text class="note" x="604" y="145">calls</text>
</svg>
</div>

<div class="al-cards">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>The catalog opens a door</span>Its <a href="/core/strategic/open-host-services">open host service</a> is the only class other contexts may call.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>It answers in JSON</span>The <a href="/core/strategic/published-language">published language</a> is the contract: plain data, versioned, no class.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Ordering translates</span>Its <a href="/core/strategic/anti-corruption-layers">anti-corruption layer</a> turns that JSON into its own words, behind a port.</div>
</div>

## The building blocks

| Building block | What it is | Use it when |
| --- | --- | --- |
| [Published Language](./published-language.md) | The JSON format exchanged between contexts. | Data crosses a context boundary, as a question, an answer or an event. |
| [Open host services](./open-host-services.md) | The documented entry point of a context, the only class others may import. | Another context needs to ask yours something. |
| [Anti-corruption layers](./anti-corruption-layers.md) | The adapter that reads another context and translates it into yours. | Your context needs something from another one. |

The events a context sends to the others are [integration events](../application/integration-events.md),
written in the published language.

## See also

- [Bounded contexts](../../guide/project-layout.md#bounded-contexts) in the project layout
- Rule: [`strategic/no-cross-context-import`](../../rules/strategic/no-cross-context-import.md)
- [Domain](../domain/index.md), the model inside each context
