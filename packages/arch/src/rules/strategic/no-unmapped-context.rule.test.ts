import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import type { AlveolusConfig } from "../../config/index.ts";
import { NoUnmappedContextRule } from "./no-unmapped-context.rule.ts";

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

function shop(config: Partial<AlveolusConfig>, orderingConsumesCatalog: boolean, catalogConsumesOrdering: boolean): TestCodebase {
	const codebase = new TestCodebase({ boundedContexts: { catalog: "catalog", ordering: "ordering", reporting: "reporting" }, subdomains: { core: ["catalog", "ordering", "reporting"] }, ...config })
		.file("src/catalog/driving/in-process/catalog-api.ts", `import type { OpenHostService } from "@alveolus/core";\nexport class CatalogApi implements OpenHostService {}`)
		.file("src/ordering/driving/in-process/ordering-api.ts", `import type { OpenHostService } from "@alveolus/core";\nexport class OrderingApi implements OpenHostService {}`)
		.file(
			"src/reporting/driven/catalog/adapters/catalog-figures.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";\nimport type { CatalogApi } from "../../../../catalog/driving/in-process/catalog-api.ts";\nexport class CatalogFigures implements AntiCorruptionLayer { constructor(private readonly api: CatalogApi) {} }`,
		);
	if (orderingConsumesCatalog) {
		codebase.file(
			"src/ordering/driven/catalog/adapters/catalog-prices.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";\nimport type { CatalogApi } from "../../../../catalog/driving/in-process/catalog-api.ts";\nexport class CatalogBalances implements AntiCorruptionLayer { constructor(private readonly api: CatalogApi) {} }`,
		);
	}
	if (catalogConsumesOrdering) {
		codebase.file(
			"src/catalog/driven/ordering/adapters/order-status.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";\nimport type { OrderingApi } from "../../../../ordering/driving/in-process/ordering-api.ts";\nexport class PaymentStatus implements AntiCorruptionLayer { constructor(private readonly api: OrderingApi) {} }`,
		);
	}
	return codebase;
}

describe("NoUnmappedContextRule", () => {
	it("accepts the consumptions the context map declares", () => {
		const contextMap = { catalog: { consumes: [] }, ordering: { consumes: ["catalog"] }, reporting: { consumes: ["catalog"] } };

		expect(shop({ contextMap }, true, false).check(new NoUnmappedContextRule())).toEqual([]);
	});

	it("rejects a consumption the context map does not declare, and says to reverse it first", () => {
		const contextMap = { catalog: { consumes: [] }, ordering: { consumes: [] }, reporting: { consumes: ["catalog"] } };

		expect(shop({ contextMap }, true, false).messages(new NoUnmappedContextRule())).toEqual([
			"ordering consumes catalog, which the context map does not allow: reverse the dependency with an integration event that ordering publishes and catalog subscribes to, not with a callback; or if ordering really is downstream of catalog, add catalog to contextMap.ordering.consumes.",
		]);
	});

	it("reports both ends of a consumption the map does not know, a cycle included", () => {
		const contextMap = { catalog: { consumes: [] }, ordering: { consumes: [] }, reporting: { consumes: ["catalog"] } };

		expect(shop({ contextMap }, true, true).check(new NoUnmappedContextRule())).toEqual([
			"src/ordering/driven/catalog/adapters/catalog-prices.adapter.ts:2 CatalogApi",
			"src/catalog/driven/ordering/adapters/order-status.adapter.ts:2 OrderingApi",
		]);
	});

	it("reads the wiring: a value of one context given to another in a composition root is a consumption", () => {
		expect(
			wired(`import { CatalogModule } from "./catalog/catalog.module.ts";
import { OrderingModule } from "./ordering/ordering.module.ts";
export class AppModule {
	private readonly catalog = new CatalogModule(() => ({ place: () => true }));
	private readonly ordering = new OrderingModule(this.catalog);
}`).check(new NoUnmappedContextRule()),
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
}`).messages(new NoUnmappedContextRule()),
		).toEqual([
			"catalog receives this.ordering.placeOrder from ordering here, which the context map does not allow: reverse the dependency with an integration event that catalog publishes and ordering subscribes to, not with a callback; or if catalog really is downstream of ordering, add ordering to contextMap.catalog.consumes.",
			"catalog receives handler from ordering here, which the context map does not allow: reverse the dependency with an integration event that catalog publishes and ordering subscribes to, not with a callback; or if catalog really is downstream of ordering, add ordering to contextMap.catalog.consumes.",
		]);
	});
});
