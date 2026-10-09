import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../test/support/test-codebase.ts";
import { NoPublicFieldRule } from "./no-public-field.rule.ts";

describe("NoPublicFieldRule", () => {
	it("accepts private fields, getters and static constants", () => {
		const codebase = new TestCodebase().file(
			"src/catalog/domain/aggregates/product.aggregate.ts",
			`import { AggregateRoot, Identifier } from "@alveolus/core";
			class ProductId extends Identifier<string, "ProductId"> {}
			export class Product extends AggregateRoot<ProductId> {
				public static readonly limit = 100;
				private stock = 0;
				protected readonly addedAt: string = "";
				public constructor(id: ProductId, private readonly sku: string) { super(id); }
				public get available(): number { return this.stock; }
				public toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.check(new NoPublicFieldRule())).toEqual([]);
	});

	it("rejects a public field, readonly or not, declared or as a constructor parameter", () => {
		const codebase = new TestCodebase().file(
			"src/catalog/domain/aggregates/product.aggregate.ts",
			`import { AggregateRoot, Identifier, ValueObject } from "@alveolus/core";
			class ProductId extends Identifier<string, "ProductId"> {}
			export class Product extends AggregateRoot<ProductId> {
				public stock = 0;
				public readonly sku = "SKU-1";
				public constructor(id: ProductId, public readonly name: string) { super(id); }
				public toSnapshot() { return { id: this.id.value }; }
			}
			export class Money extends ValueObject<{ amount: number }> { public amount = 0; }`,
		);

		expect(codebase.check(new NoPublicFieldRule())).toEqual([
			"src/catalog/domain/aggregates/product.aggregate.ts:4 Product.stock",
			"src/catalog/domain/aggregates/product.aggregate.ts:5 Product.sku",
			"src/catalog/domain/aggregates/product.aggregate.ts:6 Product.name",
			"src/catalog/domain/aggregates/product.aggregate.ts:9 Money.amount",
		]);
	});
});
