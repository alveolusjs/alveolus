import { describe, expect, it } from "vitest";

import { Order, OrderId, OrderPlaced } from "../../../test/fixtures/aggregate-root.ts";

const now = new Date("2026-01-01T00:00:00Z");

describe("AggregateRoot", () => {
	it("starts without events", () => {
		expect(new Order(new OrderId("o1")).domainEvents).toEqual([]);
	});

	it("exposes recorded events without clearing them", () => {
		const order = new Order(new OrderId("o1"));
		order.place(now);

		expect(order.domainEvents).toHaveLength(1);
		expect(order.domainEvents).toHaveLength(1);
	});

	it("does not let callers mutate its events through domainEvents", () => {
		const order = new Order(new OrderId("o1"));
		order.place(now);

		(order.domainEvents as OrderPlaced[]).length = 0;

		expect(order.domainEvents).toHaveLength(1);
	});

	it("returns recorded events in order and clears them when pulled", () => {
		const order = new Order(new OrderId("o1"));
		order.place(now);
		order.place(now);

		const events = order.pullDomainEvents();

		expect(events).toHaveLength(2);
		expect(events[0]).toBeInstanceOf(OrderPlaced);
		expect(order.pullDomainEvents()).toEqual([]);
	});

	it("defaults its version to 0", () => {
		expect(new Order(new OrderId("o1")).version).toBe(0);
	});

	it("keeps the version it was loaded at", () => {
		const order = new Order(new OrderId("o1"), { version: 3 });
		order.place(now);

		expect(order.version).toBe(3);
	});

	it.each([-1, 1.5, Number.NaN])("rejects %s as a version", (version) => {
		expect(() => new Order(new OrderId("o1"), { version })).toThrow(RangeError);
	});
});
