import { beforeEach, describe, expect, it } from "vitest";

import { Order, OrderEventsTranslator, OrderId, RecordingEventPublisher } from "../../../test/fixtures/application.ts";
import { FailingEventPublisher, InMemoryOutbox } from "../../../test/fixtures/utilities.ts";
import { Port } from "../../domain/ports/index.ts";
import { OutboxRelay } from "./outbox-relay.ts";

describe("OutboxRelay", () => {
	let outbox: InMemoryOutbox;

	beforeEach(async () => {
		outbox = new InMemoryOutbox();
		const order = new Order(new OrderId("o1"));
		order.place(42, "evt_1", new Date("2026-01-01T00:00:00Z"));
		order.place(43, "evt_2", new Date("2026-01-01T00:00:00Z"));
		await outbox.add(order.pullDomainEvents().map((event) => new OrderEventsTranslator().translate(event, { correlationId: "c1" })));
	});

	it("publishes the pending events in order and marks them as published", async () => {
		const publisher = new RecordingEventPublisher();
		const relay = new OutboxRelay(outbox, publisher);

		expect(await relay.relay()).toBe(2);
		expect(publisher.published.map((event) => event.id)).toEqual(["evt_1", "evt_2"]);
		expect(await relay.relay()).toBe(0);
		expect(publisher.published).toHaveLength(2);
		expect(outbox).toBeInstanceOf(Port);
	});

	it("publishes at most one batch per call", async () => {
		const publisher = new RecordingEventPublisher();
		const relay = new OutboxRelay(outbox, publisher, 1);

		expect(await relay.relay()).toBe(1);
		expect(await relay.relay()).toBe(1);
		expect(publisher.published.map((event) => event.id)).toEqual(["evt_1", "evt_2"]);
	});

	it("keeps the events pending when publishing fails", async () => {
		await expect(new OutboxRelay(outbox, new FailingEventPublisher()).relay()).rejects.toThrow("broker unavailable");

		expect((await outbox.pending(10)).map((event) => event.id)).toEqual(["evt_1", "evt_2"]);
	});
});
