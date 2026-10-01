import { beforeEach, describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";
import { BcIsolationRule } from "./bc-isolation.rule.ts";

describe("BcIsolationRule", () => {
	let catalog: TestCodebase;

	beforeEach(() => {
		catalog = new TestCodebase()
			.file(
				"src/catalog/driving/catalog-api.ts",
				`import type { OpenHostService } from "@alveolus/core";
		export class CatalogApi implements OpenHostService {}`,
			)
			.file("src/catalog/domain/value-objects/product-id.identifier.ts", `export class ProductId {}`)
			.file("src/catalog/published-language/product.representation.ts", `export type ProductRepresentation = { id: string };`)
			.file("src/catalog/catalog.module.ts", `export class CatalogModule {}`);
	});

	it("lets an anti-corruption layer import the open host service of another context", () => {
		const codebase = catalog.file(
			"src/ordering/driven/adapters/catalog-price-list.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";
			import type { CatalogApi } from "../../../catalog/driving/catalog-api.ts";
			export class CatalogPriceList implements AntiCorruptionLayer {}`,
		);

		expect(codebase.check(new BcIsolationRule())).toEqual([]);
	});

	it("lets a composition root import another composition root and an open host service", () => {
		const codebase = catalog.file(
			"src/ordering/ordering.module.ts",
			`import { CatalogModule } from "../catalog/catalog.module.ts";
			import { CatalogApi } from "../catalog/driving/catalog-api.ts";`,
		);

		expect(codebase.check(new BcIsolationRule())).toEqual([]);
	});

	it("rejects anything else from another context", () => {
		const codebase = catalog.file(
			"src/ordering/driven/adapters/stock.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";
			import type { ProductId } from "../../../catalog/domain/value-objects/product-id.identifier.ts";
			import type { ProductRepresentation } from "../../../catalog/published-language/product.representation.ts";
			export class Stock implements AntiCorruptionLayer {}`,
		);

		expect(codebase.check(new BcIsolationRule())).toEqual(["src/ordering/driven/adapters/stock.adapter.ts:2 ProductId", "src/ordering/driven/adapters/stock.adapter.ts:3 ProductRepresentation"]);
	});

	it("rejects an open host service used outside an anti-corruption layer", () => {
		const codebase = catalog.file(
			"src/ordering/driven/adapters/prices.adapter.ts",
			`import type { CatalogApi } from "../../../catalog/driving/catalog-api.ts";
			export class Prices {}`,
		);

		expect(codebase.check(new BcIsolationRule())).toEqual(["src/ordering/driven/adapters/prices.adapter.ts:1 CatalogApi"]);
	});

	it("keeps the shared kernel free of any bounded context", () => {
		const codebase = catalog.file("src/shared-kernel/domain/value-objects/sku.value-object.ts", `import { CatalogApi } from "../../../catalog/driving/catalog-api.ts";`);

		expect(codebase.check(new BcIsolationRule())).toEqual(["src/shared-kernel/domain/value-objects/sku.value-object.ts:1 CatalogApi"]);
	});
});
