import { describe, expect, it } from "vitest";

import { OrderId, OrderPlaced, OrderShipped } from "../../../test/fixtures/domain-event.ts";

const occurredAt = new Date("2026-01-01T00:00:00Z");

describe("DomainEvent", () => {
	it("exposes its type, aggregate id, date and payload", () => {
		const event = new OrderPlaced({
			aggregateId: new OrderId("o1"),
			occurredAt,
			payload: { total: 42 },
		});

		expect(event.type).toBe("OrderPlaced");
		expect(event.aggregateId.value).toBe("o1");
		expect(event.occurredAt).toEqual(occurredAt);
		expect(event.payload).toEqual({ total: 42 });
	});

	it("keeps its own copy of the date", () => {
		const date = new Date(occurredAt);
		const event = new OrderPlaced({
			aggregateId: new OrderId("o1"),
			occurredAt: date,
			payload: { total: 42 },
		});

		date.setFullYear(2000);

		expect(event.occurredAt).toEqual(occurredAt);
	});

	it("uses the class name as its type", () => {
		expect(new OrderShipped({ aggregateId: new OrderId("o1"), occurredAt, payload: null }).type).toBe("OrderShipped");
	});
});
