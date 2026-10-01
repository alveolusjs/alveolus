import { describe, expect, it } from "vitest";

import type { OrderPlacedRepresentation } from "../../../test/fixtures/application.ts";
import { OrderEventsTranslator, OrderId, OrderPlaced } from "../../../test/fixtures/application.ts";
import { EventTranslator } from "./event-translator.ts";

describe("EventTranslator", () => {
	const placed = new OrderPlaced({ aggregateId: new OrderId("o1"), id: "evt_1", occurredAt: new Date("2026-01-01T00:00:00Z"), payload: { total: 42 } });

	it("turns a domain event into an integration event of the published language", () => {
		const translator = new OrderEventsTranslator();

		expect(translator.translate(placed, { correlationId: "c1" })).toEqual({
			correlationId: "c1",
			id: "evt_1",
			occurredAt: "2026-01-01T00:00:00.000Z",
			payload: { orderId: "o1", total: 42 },
			source: "ordering",
			type: "OrderPlaced",
			version: 1,
		});
		expect(translator).toBeInstanceOf(EventTranslator);
	});

	it("keeps the causation id when given", () => {
		const event = new OrderEventsTranslator().translate(placed, { causationId: "cmd_1", correlationId: "c1" });

		expect(event.causationId).toBe("cmd_1");
	});

	it("survives a JSON round trip", () => {
		const event = new OrderEventsTranslator().translate(placed, { correlationId: "c1" });
		const parsed: OrderPlacedRepresentation = JSON.parse(JSON.stringify(event));

		expect(parsed).toEqual(event);
	});
});
