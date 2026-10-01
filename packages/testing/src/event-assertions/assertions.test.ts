import { describe, expect, it } from "vitest";

import { AssertionError } from "node:assert";

import { Order, OrderCancelled, OrderId, OrderPlaced } from "../../test/fixtures/order.ts";
import { assertRecorded, assertRecordedNothing } from "./assertions.ts";

const placedOrder = (total = 42): Order => {
	const order = Order.create(new OrderId("o1"));
	order.place(total);
	return order;
};

describe("assertRecorded", () => {
	it("returns the recorded event of the given class", () => {
		const event = assertRecorded(placedOrder(), OrderPlaced);

		expect(event).toBeInstanceOf(OrderPlaced);
		expect(event.payload.total).toBe(42);
	});

	it("matches the payload deeply", () => {
		expect(() => assertRecorded(placedOrder(), OrderPlaced, { total: 42 })).not.toThrow();
	});

	it("finds a matching payload among several events of the same class", () => {
		const order = placedOrder(1);
		order.place(2);

		expect(assertRecorded(order, OrderPlaced, { total: 2 }).payload.total).toBe(2);
	});

	it("fails and lists recorded events when no event of the class was recorded", () => {
		expect(() => assertRecorded(placedOrder(), OrderCancelled)).toThrow(
			new AssertionError({
				message: "Expected OrderCancelled to be recorded, recorded: OrderCreated, OrderPlaced",
			}),
		);
	});

	it("fails with a diff when the payload differs", () => {
		const error = (() => {
			try {
				assertRecorded(placedOrder(), OrderPlaced, { total: 7 });
			} catch (caught) {
				return caught;
			}
		})();

		expect(error).toBeInstanceOf(AssertionError);
		expect(error).toMatchObject({ actual: { total: 42 }, expected: { total: 7 } });
	});

	it("does not clear recorded events", () => {
		const order = placedOrder();
		assertRecorded(order, OrderPlaced);

		expect(order.domainEvents).toHaveLength(2);
	});

	it("rejects a payload of the wrong type at compile time", () => {
		// @ts-expect-error
		expect(() => assertRecorded(placedOrder(), OrderPlaced, { reason: "x" })).toThrow();
	});
});

describe("assertRecordedNothing", () => {
	it("passes when nothing was recorded", () => {
		const order = Order.create(new OrderId("o1"));
		order.pullDomainEvents();

		expect(() => assertRecordedNothing(order)).not.toThrow();
	});

	it("fails and lists recorded events otherwise", () => {
		expect(() => assertRecordedNothing(placedOrder())).toThrow(
			"Expected no recorded events, recorded: OrderCreated, OrderPlaced",
		);
	});
});
