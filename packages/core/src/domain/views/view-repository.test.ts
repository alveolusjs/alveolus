import { describe, expect, it } from "vitest";

import type { ViewRepository } from "./view-repository.ts";

type OrderSummary = { id: string; total: number };

interface OrderSummaryRepository extends ViewRepository<OrderSummary> {
	findById(orderId: string): Promise<OrderSummary | undefined>;
}

interface InterfaceView {
	id: string;
}

describe("ViewRepository", () => {
	it("is extended with the reads of one view", async () => {
		const summaries: OrderSummaryRepository = {
			findById: (orderId) => Promise.resolve(orderId === "o1" ? { id: "o1", total: 42 } : undefined),
		};

		expect(await summaries.findById("o1")).toEqual({ id: "o1", total: 42 });
		expect(await summaries.findById("o2")).toBeUndefined();
	});

	it("only accepts a JSON view declared with a type alias", () => {
		// @ts-expect-error
		const dated: ViewRepository<{ placedAt: Date }> | undefined = undefined;
		// @ts-expect-error
		const withInterface: ViewRepository<InterfaceView> | undefined = undefined;

		expect([dated, withInterface]).toEqual([undefined, undefined]);
	});
});
