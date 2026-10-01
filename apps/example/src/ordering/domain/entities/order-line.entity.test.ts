import { describe, expect, it } from "vitest";

import { OrderLineBuilder } from "../../../../test/builders/order-line.builder.ts";
import { InvalidQuantity } from "../errors/invalid-quantity.error.ts";
import { OrderLine } from "./order-line.entity.ts";

describe("OrderLine", () => {
	it("computes its total", () => {
		expect(new OrderLineBuilder().withQuantity(3).build().total.amount).toBe(3750);
	});

	it("changes its quantity only to a positive integer", () => {
		const line = new OrderLineBuilder().build();

		expect(line.changeQuantity(0)).toEqual({ error: new InvalidQuantity({ quantity: 0 }), ok: false });
		expect(line.changeQuantity(4).ok).toBe(true);
		expect(line.total.amount).toBe(5000);
	});

	it("is rebuilt from its snapshot", () => {
		const line = new OrderLineBuilder().withQuantity(2).build();

		expect(line.toSnapshot()).toEqual({
			id: "lin_1",
			productId: "prd_1",
			quantity: 2,
			unitPrice: { amount: 1250, currency: "EUR" },
		});
		expect(OrderLine.fromSnapshot(line.toSnapshot()).equals(line)).toBe(true);
	});

	it("refuses a corrupted snapshot", () => {
		const snapshot = new OrderLineBuilder().build().toSnapshot();

		expect(() => OrderLine.fromSnapshot({ ...snapshot, unitPrice: { amount: 100, currency: "euro" } })).toThrow(
			"Order line lin_1 has a corrupted unit price",
		);
		expect(() => OrderLine.fromSnapshot({ ...snapshot, unitPrice: { amount: -1, currency: "EUR" } })).toThrow(
			"Order line lin_1 has a corrupted unit price",
		);
	});
});
