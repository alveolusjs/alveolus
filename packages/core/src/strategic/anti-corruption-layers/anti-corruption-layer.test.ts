import { describe, expect, it } from "vitest";

import { CatalogPriceList, PriceList } from "../../../test/fixtures/strategic.ts";

describe("AntiCorruptionLayer", () => {
	it("marks the adapter that translates another context into the local language", async () => {
		const prices = new CatalogPriceList([{ id: "p1", price: 990 }]);

		expect(await prices.priceOf("p1")).toBe(990);
		expect(await prices.priceOf("p2")).toBeUndefined();
		expect(prices).toBeInstanceOf(PriceList);
	});
});
