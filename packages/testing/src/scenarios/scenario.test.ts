import { describe, expect, it } from "vitest";

import {
	InvalidTotal,
	Order,
	OrderAlreadyCancelled,
	OrderCancelled,
	OrderCreated,
	OrderId,
	OrderPlaced,
} from "../../test/fixtures/order.ts";
import { given } from "./given.ts";

describe("given / when / then", () => {
	it("asserts on the events recorded by the action", () => {
		given(Order.create(new OrderId("o1")))
			.when((order) => order.place(42))
			.thenRecorded(OrderPlaced, { total: 42 });
	});

	it("ignores events recorded while building the aggregate", () => {
		expect(() =>
			given(Order.create(new OrderId("o1")))
				.when((order) => order.place(42))
				.thenRecorded(OrderCreated),
		).toThrow("Expected OrderCreated to be recorded, recorded: OrderPlaced");
	});

	it("chains assertions", () => {
		given(Order.create(new OrderId("o1")))
			.when((order) => {
				order.place(42);
				order.cancel("changed my mind");
			})
			.thenRecorded(OrderPlaced)
			.thenRecorded(OrderCancelled, { reason: "changed my mind" });
	});

	it("asserts that the action recorded nothing", () => {
		given(Order.create(new OrderId("o1")))
			.when((order) => order.confirm())
			.thenRecordedNothing();
	});

	it("exposes the aggregate for state assertions", () => {
		const order = Order.create(new OrderId("o1"));

		const scenario = given(order).when((o) => o.place(42));

		expect(scenario.aggregate).toBe(order);
	});

	it("is not a thenable", async () => {
		const scenario = given(Order.create(new OrderId("o1"))).when((o) => o.place(42));

		expect(await scenario).toBe(scenario);
	});
});

describe("results", () => {
	it("asserts that the action succeeded", () => {
		given(Order.create(new OrderId("o1")))
			.when((order) => order.place(42))
			.thenSucceeded()
			.thenRecorded(OrderPlaced);
	});

	it("asserts that the action failed with an error class and payload", () => {
		given(Order.create(new OrderId("o1")))
			.when((order) => order.place(0))
			.thenFailedWith(InvalidTotal, { total: 0 })
			.thenRecordedNothing();
	});

	it("exposes the returned result", () => {
		const scenario = given(Order.create(new OrderId("o1"))).when((order) => order.place(0));

		expect(scenario.result.ok).toBe(false);
	});

	it("fails thenSucceeded when the action failed", () => {
		expect(() =>
			given(Order.create(new OrderId("o1")))
				.when((order) => order.place(0))
				.thenSucceeded(),
		).toThrow("Expected the action to succeed, but the action failed with InvalidTotal");
	});

	it("fails thenSucceeded when the action returned no Result", () => {
		expect(() =>
			given(Order.create(new OrderId("o1")))
				.when((order) => order.id)
				.thenSucceeded(),
		).toThrow("Expected the action to succeed, but the action returned object, not a Result");
	});

	it("fails thenFailedWith when the action succeeded", () => {
		expect(() =>
			given(Order.create(new OrderId("o1")))
				.when((order) => order.place(42))
				.thenFailedWith(InvalidTotal),
		).toThrow("Expected the action to fail with InvalidTotal, but the action succeeded");
	});

	it("fails thenFailedWith on another error class", () => {
		const order = Order.create(new OrderId("o1"));
		order.cancel("first");

		expect(() =>
			given(order)
				.when((o) => o.cancel("second"))
				.thenFailedWith(InvalidTotal),
		).toThrow("Expected the action to fail with InvalidTotal, but the action failed with OrderAlreadyCancelled");
	});

	it("fails thenFailedWith with a diff when the payload differs", () => {
		const error = (() => {
			try {
				given(Order.create(new OrderId("o1")))
					.when((order) => order.place(0))
					.thenFailedWith(InvalidTotal, { total: -1 });
			} catch (caught) {
				return caught;
			}
		})();

		expect(error).toMatchObject({ actual: { total: 0 }, expected: { total: -1 } });
	});

	it("passes thenFailedWith without payload for errors without data", () => {
		const order = Order.create(new OrderId("o1"));
		order.cancel("first");

		given(order)
			.when((o) => o.cancel("second"))
			.thenFailedWith(OrderAlreadyCancelled);
	});
});
