import { beforeEach, describe, expect, it } from "vitest";

import { FakeOrderSummaryRepository } from "../../../../test/fakes/order-summary-repository.fake.ts";
import { OrderNotFound } from "../../domain/errors/order-not-found.error.ts";
import type { OrderSummary } from "../../domain/views/order-summary.view.ts";
import { GetOrderSummaryHandler } from "./get-order-summary.query.ts";

const summary: OrderSummary = {
	currency: "EUR",
	customerId: "cus_1",
	id: "ord_1",
	lineCount: 1,
	status: "placed",
	total: 2500,
};

describe("GetOrderSummaryHandler", () => {
	let getOrderSummary: GetOrderSummaryHandler;

	beforeEach(() => {
		getOrderSummary = new GetOrderSummaryHandler(new FakeOrderSummaryRepository([summary]));
	});

	it("returns the summary of the order", async () => {
		expect(await getOrderSummary.handle({ orderId: "ord_1" })).toEqual({ ok: true, value: summary });
	});

	it("returns OrderNotFound for an unknown order", async () => {
		expect(await getOrderSummary.handle({ orderId: "ord_404" })).toEqual({
			error: new OrderNotFound({ orderId: "ord_404" }),
			ok: false,
		});
	});
});
