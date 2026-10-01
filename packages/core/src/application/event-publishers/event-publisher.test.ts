import { describe, expect, it } from "vitest";

import { Order, OrderEventsTranslator, OrderId, RecordingEventPublisher } from "../../../test/fixtures/application.ts";
import { Port } from "../../domain/ports/index.ts";
import { EventPublisher } from "./event-publisher.ts";

describe("EventPublisher", () => {
	it("is extended by the adapter that publishes integration events", async () => {
		const order = new Order(new OrderId("o1"));
		order.place(42, "evt_1", new Date("2026-01-01T00:00:00Z"));
		const publisher = new RecordingEventPublisher();

		await publisher.publish(order.pullDomainEvents().map((event) => new OrderEventsTranslator().translate(event, { correlationId: "c1" })));

		expect(publisher.published).toHaveLength(1);
		expect(publisher).toBeInstanceOf(EventPublisher);
		expect(publisher).toBeInstanceOf(Port);
	});
});
