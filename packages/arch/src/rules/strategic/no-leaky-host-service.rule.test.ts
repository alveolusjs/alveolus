import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import { NoLeakyHostServiceRule } from "./no-leaky-host-service.rule.ts";

function catalog(api: string): TestCodebase {
	return new TestCodebase()
		.file(
			"src/catalog/domain/aggregates/product.aggregate.ts",
			`import { AggregateRoot, Identifier } from "@alveolus/core";
			export class ProductId extends Identifier<string, "ProductId"> {}
			export class Product extends AggregateRoot<ProductId> { toSnapshot() { return { id: this.id.value }; } }`,
		)
		.file("src/shared-kernel/domain/value-objects/money.value-object.ts", `import { ValueObject } from "@alveolus/core";\nexport class Money extends ValueObject<{ amount: number }> {}`)
		.file("src/catalog/published-language/product.representation.ts", `export type ProductRepresentation = { readonly id: string; readonly price: number };`)
		.file("src/catalog/driving/in-process/catalog-api.ts", api);
}

describe("NoLeakyHostServiceRule", () => {
	it("accepts the published language, plain values and the shared kernel", () => {
		const codebase = catalog(
			`import type { OpenHostService } from "@alveolus/core";
			import type { ProductRepresentation } from "../../published-language/product.representation.ts";
			import type { Money } from "../../../shared-kernel/domain/value-objects/money.value-object.ts";
			import type { Product } from "../../domain/aggregates/product.aggregate.ts";
			export class CatalogApi implements OpenHostService {
				constructor(private readonly products: Map<string, Product>) {}
				product(id: string): Promise<ProductRepresentation | undefined> { return Promise.resolve(undefined); }
				price(id: string): Money | undefined { return undefined; }
			}`,
		);

		expect(codebase.check(new NoLeakyHostServiceRule())).toEqual([]);
	});

	it("rejects a class of the context in a parameter, a result, a property or a getter", () => {
		const codebase = catalog(
			`import type { OpenHostService } from "@alveolus/core";
			import type { Product, ProductId } from "../../domain/aggregates/product.aggregate.ts";
			export class CatalogApi implements OpenHostService {
				constructor(public readonly products: readonly Product[]) {}
				product(id: ProductId): Promise<Product | undefined> { return Promise.resolve(undefined); }
				get first(): Product | undefined { return this.products[0]; }
			}`,
		);

		expect(codebase.messages(new NoLeakyHostServiceRule())).toEqual([
			"CatalogApi.products exposes Product, an AggregateRoot of catalog: an open host service speaks the published language.",
			"CatalogApi.product exposes ProductId, an Identifier of catalog: an open host service speaks the published language.",
			"CatalogApi.product exposes Product, an AggregateRoot of catalog: an open host service speaks the published language.",
			"CatalogApi.first exposes Product, an AggregateRoot of catalog: an open host service speaks the published language.",
		]);
	});
});
