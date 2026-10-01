import { assertRecordedNothing, given } from "@alveolus/testing";
import { describe, expect, it } from "vitest";

import { MoneyBuilder } from "../../../../test/builders/money.builder.ts";
import { OrderBuilder } from "../../../../test/builders/order.builder.ts";
import { CurrencyMismatch } from "../errors/currency-mismatch.error.ts";
import { EmptyOrder } from "../errors/empty-order.error.ts";
import { InvalidQuantity } from "../errors/invalid-quantity.error.ts";
import { OrderAlreadyCancelled } from "../errors/order-already-cancelled.error.ts";
import { OrderNotDraft } from "../errors/order-not-draft.error.ts";
import { OrderCancelled } from "../events/order-cancelled.event.ts";
import { OrderPlaced } from "../events/order-placed.event.ts";
import { OrderLineId } from "../value-objects/order-line-id.identifier.ts";
import { ProductId } from "../value-objects/product-id.identifier.ts";
import { Order } from "./order.aggregate.ts";

const now = new Date("2026-01-01T10:00:00Z");
const lineId = new OrderLineId("lin_9");
const productId = new ProductId("prd_9");

describe("Order", () => {
	it("is created as an empty draft without events", () => {
		const order = new OrderBuilder().build();

		expect(order.toSnapshot()).toMatchObject({ lines: [], status: "draft" });
		assertRecordedNothing(order);
	});

	it("adds a line in its currency", () => {
		const { aggregate } = given(new OrderBuilder().build())
			.when((order) => order.addLine(lineId, productId, new MoneyBuilder().withAmount(1250).build(), 2))
			.thenSucceeded()
			.thenRecordedNothing();

		expect(aggregate.total).toBe(2500);
	});

	it("refuses a line in another currency", () => {
		given(new OrderBuilder().build())
			.when((order) => order.addLine(lineId, productId, new MoneyBuilder().withCurrency("USD").build(), 1))
			.thenFailedWith(CurrencyMismatch, { actual: "USD", expected: "EUR" });
	});

	it("refuses a line with an invalid quantity", () => {
		given(new OrderBuilder().build())
			.when((order) => order.addLine(lineId, productId, new MoneyBuilder().build(), 0))
			.thenFailedWith(InvalidQuantity, { quantity: 0 });
	});

	it("is placed and records its total", () => {
		given(new OrderBuilder().withLine({ quantity: 2 }).build())
			.when((order) => order.place(now))
			.thenSucceeded()
			.thenRecorded(OrderPlaced, { currency: "EUR", customerId: "cus_1", total: 2500 });
	});

	it("cannot be placed empty", () => {
		given(new OrderBuilder().build())
			.when((order) => order.place(now))
			.thenFailedWith(EmptyOrder)
			.thenRecordedNothing();
	});

	it("cannot be placed twice nor changed once placed", () => {
		given(new OrderBuilder().withLine().placed(now).build())
			.when((order) => order.place(now))
			.thenFailedWith(OrderNotDraft, { status: "placed" });
		given(new OrderBuilder().withLine().placed(now).build())
			.when((order) => order.addLine(lineId, productId, new MoneyBuilder().build(), 1))
			.thenFailedWith(OrderNotDraft, { status: "placed" });
	});

	it("is cancelled once", () => {
		given(new OrderBuilder().withLine().build())
			.when((order) => order.cancel("customer request", now))
			.thenSucceeded()
			.thenRecorded(OrderCancelled, { reason: "customer request" });
		given(new OrderBuilder().withLine().cancelled("customer request", now).build())
			.when((order) => order.cancel("again", now))
			.thenFailedWith(OrderAlreadyCancelled);
	});

	it("refuses a snapshot with a corrupted currency", () => {
		expect(() => Order.fromSnapshot({ ...new OrderBuilder().build().toSnapshot(), currency: "euro" }, 1)).toThrow(
			"Order ord_1 has a corrupted currency",
		);
	});

	it("is rebuilt from its JSON snapshot", () => {
		const order = new OrderBuilder().withLine({ quantity: 2 }).placed(now).build();

		const rebuilt = Order.fromSnapshot(JSON.parse(JSON.stringify(order.toSnapshot())), 4);

		expect(rebuilt.toSnapshot()).toEqual(order.toSnapshot());
		expect(rebuilt.toSnapshot()).toMatchObject({ placedAt: "2026-01-01T10:00:00.000Z", status: "placed" });
		expect(rebuilt.version).toBe(4);
		assertRecordedNothing(rebuilt);
	});
});
