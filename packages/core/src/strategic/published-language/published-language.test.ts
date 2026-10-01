import { describe, expect, it } from "vitest";

import type { PublishedLanguage } from "./published-language.ts";

type ProductRepresentation = PublishedLanguage<{ id: string; price: { amount: number; currency: string } }>;

interface InterfaceRepresentation {
	id: string;
}

describe("PublishedLanguage", () => {
	it("is the JSON type it wraps", () => {
		const product: ProductRepresentation = JSON.parse('{"id":"p1","price":{"amount":990,"currency":"EUR"}}');

		expect(product.price.amount).toBe(990);
	});

	it("only accepts JSON declared with a type alias", () => {
		// @ts-expect-error
		const dated: PublishedLanguage<{ at: Date }> | undefined = undefined;
		// @ts-expect-error
		const withInterface: PublishedLanguage<InterfaceRepresentation> | undefined = undefined;
		// @ts-expect-error
		const withFunction: PublishedLanguage<{ run: () => void }> | undefined = undefined;

		expect([dated, withInterface, withFunction]).toEqual([undefined, undefined, undefined]);
	});
});
