import { beforeEach, describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import { NoCrossContextImportRule } from "./no-cross-context-import.rule.ts";

function wired(app: string): TestCodebase {
	return new TestCodebase()
		.file(
			"src/catalog/driving/in-process/catalog-api.ts",
			`import type { OpenHostService } from "@alveolus/core";\nexport class CatalogApi implements OpenHostService { public price(id: string): number { return 1; } }`,
		)
		.file(
			"src/catalog/catalog.module.ts",
			`import { CatalogApi } from "./driving/in-process/catalog-api.ts";\nexport class CatalogModule { public readonly api = new CatalogApi(); public constructor(private readonly orders: () => { place(id: string): boolean }) {} }`,
		)
		.file("src/ordering/application/commands/place-order.command.ts", `export class PlaceOrderHandler { public place(id: string): boolean { return true; } }`)
		.file(
			"src/ordering/driven/catalog/adapters/catalog-prices.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";
import type { CatalogApi } from "../../../../catalog/driving/in-process/catalog-api.ts";
export class CatalogPrices implements AntiCorruptionLayer { public constructor(private readonly api: CatalogApi) {} }`,
		)
		.file(
			"src/ordering/ordering.module.ts",
			`import type { CatalogModule } from "../catalog/catalog.module.ts";
import { PlaceOrderHandler } from "./application/commands/place-order.command.ts";
import { CatalogPrices } from "./driven/catalog/adapters/catalog-prices.adapter.ts";
export class OrderingModule {
	public readonly placeOrder = new PlaceOrderHandler();
	public readonly prices: CatalogPrices;
	public constructor(catalog: CatalogModule) { this.prices = new CatalogPrices(catalog.api); }
}`,
		)
		.file("src/app.module.ts", app);
}

function withCatalog(codebase: TestCodebase): TestCodebase {
	return codebase
		.file(
			"src/catalog/driving/catalog-api.ts",
			`import type { OpenHostService } from "@alveolus/core";
		export class CatalogApi implements OpenHostService {}`,
		)
		.file("src/catalog/domain/value-objects/product-id.identifier.ts", `export class ProductId {}`)
		.file("src/catalog/published-language/product.representation.ts", `export type ProductRepresentation = { id: string };`)
		.file("src/catalog/catalog.module.ts", `export class CatalogModule {}`);
}

describe("NoCrossContextImportRule", () => {
	let catalog: TestCodebase;

	beforeEach(() => {
		catalog = withCatalog(new TestCodebase());
	});

	it("lets an anti-corruption layer import the open host service of another context", () => {
		const codebase = catalog.file(
			"src/ordering/driven/adapters/catalog-price-list.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";
			import type { CatalogApi } from "../../../catalog/driving/catalog-api.ts";
			export class CatalogPriceList implements AntiCorruptionLayer {}`,
		);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual([]);
	});

	it("lets a composition root import another composition root and an open host service", () => {
		const codebase = catalog.file(
			"src/ordering/ordering.module.ts",
			`import { CatalogModule } from "../catalog/catalog.module.ts";
			import { CatalogApi } from "../catalog/driving/catalog-api.ts";`,
		);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual([]);
	});

	it("rejects anything else from another context", () => {
		const codebase = catalog.file(
			"src/ordering/driven/adapters/stock.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";
			import type { ProductId } from "../../../catalog/domain/value-objects/product-id.identifier.ts";
			import type { ProductRepresentation } from "../../../catalog/published-language/product.representation.ts";
			export class Stock implements AntiCorruptionLayer {}`,
		);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual([
			"src/ordering/driven/adapters/stock.adapter.ts:2 ProductId",
			"src/ordering/driven/adapters/stock.adapter.ts:3 ProductRepresentation",
		]);
	});

	it("rejects an open host service used outside an anti-corruption layer", () => {
		const codebase = catalog.file(
			"src/ordering/driven/adapters/prices.adapter.ts",
			`import type { CatalogApi } from "../../../catalog/driving/catalog-api.ts";
			export class Prices {}`,
		);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual(["src/ordering/driven/adapters/prices.adapter.ts:1 CatalogApi"]);
	});

	it("lets a supporting or generic context use an open host service anywhere, but still only the open host service", () => {
		const codebase = withCatalog(new TestCodebase({ subdomains: { core: ["catalog"], supporting: ["ordering"] } })).file(
			"src/ordering/driven/adapters/prices.adapter.ts",
			`import type { CatalogApi } from "../../../catalog/driving/catalog-api.ts";
			import type { ProductId } from "../../../catalog/domain/value-objects/product-id.identifier.ts";
			import type { ProductRepresentation } from "../../../catalog/published-language/product.representation.ts";
			export class Prices {}`,
		);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual([
			"src/ordering/driven/adapters/prices.adapter.ts:2 ProductId",
			"src/ordering/driven/adapters/prices.adapter.ts:3 ProductRepresentation",
		]);
	});

	it("rejects a file the analysis does not see, which could relay another context, in a context of any subdomain", () => {
		const codebase = withCatalog(new TestCodebase({ ignore: ["**/*.fixture.ts"], subdomains: { core: ["catalog"], generic: ["ordering"] } }))
			.file("src/ordering/domain/value-objects/product-id.fixture.ts", `export { ProductId } from "../../../catalog/domain/value-objects/product-id.identifier.ts";`)
			.file("lib/relay.ts", `export { ProductId } from "../src/catalog/domain/value-objects/product-id.identifier.ts";`)
			.file(
				"src/ordering/domain/services/pricing.service.ts",
				`import { ProductId } from "../value-objects/product-id.fixture.ts";
				import { relay } from "../../../../lib/relay.ts";
				import { legacy } from "./legacy.js";`,
			);

		expect(codebase.messages(new NoCrossContextImportRule())).toEqual([
			"Imports src/ordering/domain/value-objects/product-id.fixture.ts (ignored by the analysis): the analysis cannot tell which bounded context it reaches; move the file into a bounded context or the shared kernel.",
			"Imports lib/relay.ts (outside the declared bounded contexts and shared kernel): the analysis cannot tell which bounded context it reaches; move the file into a bounded context or the shared kernel.",
			"Imports src/ordering/domain/services/legacy.js (not resolved by the analysis): the analysis cannot tell which bounded context it reaches; move the file into a bounded context or the shared kernel.",
		]);
	});

	it("rejects code loaded at runtime, in a context of any subdomain", () => {
		const codebase = withCatalog(new TestCodebase({ subdomains: { core: ["catalog"], generic: ["ordering"] } })).file(
			"src/ordering/driven/memory/adapters/memory-prices.adapter.ts",
			`import { createRequire } from "node:module";
			export class MemoryPrices {
				private static readonly load = createRequire(import.meta.url);
				private static readonly run = new Function("s", "return import(s)");
			}`,
		);

		expect(codebase.messages(new NoCrossContextImportRule())).toEqual([
			"Loads code at runtime with node:module: the analysis cannot tell which bounded context it reaches; use a static import.",
			"Loads code at runtime with Function: the analysis cannot tell which bounded context it reaches; use a static import.",
		]);
	});

	it("keeps the shared kernel free of any bounded context", () => {
		const codebase = catalog.file("src/shared-kernel/domain/value-objects/sku.value-object.ts", `import { CatalogApi } from "../../../catalog/driving/catalog-api.ts";`);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual(["src/shared-kernel/domain/value-objects/sku.value-object.ts:1 CatalogApi"]);
	});

	it("reads import types and dynamic imports of another context", () => {
		const codebase = catalog.file(
			"src/ordering/driven/adapters/prices.adapter.ts",
			`type ProductId = import("../../../catalog/domain/value-objects/product-id.identifier.ts").ProductId;
			const load = () => import("../../../catalog/domain/value-objects/product-id.identifier.ts");`,
		);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual(["src/ordering/driven/adapters/prices.adapter.ts:1 ProductId", "src/ordering/driven/adapters/prices.adapter.ts:2 *"]);
	});

	it("reads reference directives and module augmentations of another context", () => {
		const codebase = catalog.file(
			"src/ordering/domain/services/pricing.service.ts",
			`/// <reference path="../../../catalog/domain/value-objects/product-id.identifier.ts" />
			declare module "../../../catalog/domain/value-objects/product-id.identifier.ts" { interface ProductId { sku: string } }
			export class Pricing {}`,
		);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual(["src/ordering/domain/services/pricing.service.ts:1 *", "src/ordering/domain/services/pricing.service.ts:2 *"]);
	});

	it("keeps a composition root from re-exporting what other contexts would reach through it", () => {
		const codebase = catalog
			.file("src/catalog/domain/aggregates/product.aggregate.ts", `export class Product {}`)
			.file("src/catalog/catalog.module.ts", `export class CatalogModule {}\nexport { Product } from "./domain/aggregates/product.aggregate.ts";`)
			.file("src/ordering/ordering.module.ts", `import { CatalogModule } from "../catalog/catalog.module.ts";`);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual(["src/catalog/catalog.module.ts:2 Product"]);
	});

	it("lets only the open host service of another context cross in the wiring", () => {
		expect(
			wired(`import { CatalogModule } from "./catalog/catalog.module.ts";
import { OrderingModule } from "./ordering/ordering.module.ts";
export class AppModule {
	private readonly catalog = new CatalogModule(() => ({ place: () => true }));
	private readonly ordering = new OrderingModule(this.catalog);
}`).check(new NoCrossContextImportRule()),
		).toEqual([]);
		expect(
			wired(`import { CatalogModule } from "./catalog/catalog.module.ts";
import { OrderingModule } from "./ordering/ordering.module.ts";
export class AppModule {
	private readonly ordering: OrderingModule;
	private readonly catalog: CatalogModule;
	public constructor() {
		this.catalog = new CatalogModule(() => this.ordering.placeOrder);
		this.ordering = new OrderingModule(this.catalog);
		const handler = this.ordering.placeOrder;
		new CatalogModule(() => handler);
	}
}`).messages(new NoCrossContextImportRule()),
		).toEqual([
			"Gives this.ordering.placeOrder, from ordering, to catalog: only an OpenHostService of another bounded context may cross, in an import or in the wiring.",
			"Gives handler, from ordering, to catalog: only an OpenHostService of another bounded context may cross, in an import or in the wiring.",
		]);
	});

	it("reads the wiring in the composition root of a context too", () => {
		const codebase = wired(`export class AppModule {}`)
			.file("src/catalog/domain/services/pricing.service.ts", `export class Pricing {}`)
			.file(
				"src/catalog/catalog.module.ts",
				`import { CatalogApi } from "./driving/in-process/catalog-api.ts";
import { Pricing } from "./domain/services/pricing.service.ts";
export class CatalogModule { public readonly api = new CatalogApi(); public readonly pricing = new Pricing(); }`,
			)
			.file(
				"src/ordering/ordering.module.ts",
				`import type { CatalogModule } from "../catalog/catalog.module.ts";
import { CatalogPrices } from "./driven/catalog/adapters/catalog-prices.adapter.ts";
export class OrderingModule {
	public readonly prices: CatalogPrices;
	public constructor(catalog: CatalogModule) { this.prices = new CatalogPrices(catalog.pricing as never); }
}`,
			);

		expect(codebase.check(new NoCrossContextImportRule())).toEqual(["src/ordering/ordering.module.ts:5 catalog.pricing"]);
	});
});
