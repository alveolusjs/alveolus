import { describe, expect, it } from "vitest";

import { Order, OrderId, OrderPlaced } from "../../../test/fixtures/aggregate-root.ts";

const now = new Date("2026-01-01T00:00:00Z");

describe("AggregateRoot", () => {
	it("starts without events", () => {
		expect(new Order(new OrderId("o1")).domainEvents).toEqual([]);
	});

	it("exposes recorded events without clearing them", () => {
		const order = new Order(new OrderId("o1"));
		order.place("evt_1", now);

		expect(order.domainEvents).toHaveLength(1);
		expect(order.domainEvents).toHaveLength(1);
	});

	it("does not let callers mutate its events through domainEvents", () => {
		const order = new Order(new OrderId("o1"));
		order.place("evt_2", now);

		(order.domainEvents as OrderPlaced[]).length = 0;

		expect(order.domainEvents).toHaveLength(1);
	});

	it("returns recorded events in order and clears them when pulled", () => {
		const order = new Order(new OrderId("o1"));
		order.place("evt_3", now);
		order.place("evt_4", now);

		const events = order.pullDomainEvents();

		expect(events).toHaveLength(2);
		expect(events[0]).toBeInstanceOf(OrderPlaced);
		expect(order.pullDomainEvents()).toEqual([]);
	});

	it("turns into a snapshot without its pending events", () => {
		const order = new Order(new OrderId("o1"));
		order.place("evt_1", now);

		expect(order.toSnapshot()).toEqual({ id: "o1" });
	});
});
