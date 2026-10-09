import { beforeEach, describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import { NoCrossContextImportRule } from "./no-cross-context-import.rule.ts";

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
});
