import { Notification } from "@alveolus/core";
import { beforeEach, describe, expect, it } from "vitest";

import { OrderBuilder } from "../../../../test/builders/order.builder.ts";
import { FixedClock } from "../../../../test/fakes/fixed-clock.fake.ts";
import { FakeOrderRepository } from "../../../../test/fakes/order-repository.fake.ts";
import { RecordingEventPublisher } from "../../../../test/fakes/recording-event-publisher.fake.ts";
import { RecordingNotificationPublisher } from "../../../../test/fakes/recording-notification-publisher.fake.ts";
import { SequentialIdGenerator } from "../../../../test/fakes/sequential-id-generator.fake.ts";
import { EmptyOrder } from "../../domain/errors/empty-order.error.ts";
import { OrderPlaced } from "../../domain/events/order-placed.event.ts";
import { OrderId } from "../../domain/value-objects/order-id.identifier.ts";
import type { Audit } from "../metadata/audit.metadata.ts";
import { PlaceOrderHandler } from "./place-order.command.ts";

const audit: Audit = { channel: "api", userId: "usr_7" };

describe("PlaceOrderHandler", () => {
	let orders: FakeOrderRepository;
	let events: RecordingEventPublisher;
	let notifications: RecordingNotificationPublisher;
	let clock: FixedClock;
	let placeOrder: PlaceOrderHandler;

	beforeEach(() => {
		orders = new FakeOrderRepository();
		events = new RecordingEventPublisher();
		notifications = new RecordingNotificationPublisher();
		clock = new FixedClock();
		placeOrder = new PlaceOrderHandler(orders, events, notifications, clock, new SequentialIdGenerator());
	});

	it("places the order, saves it and publishes its events and notifications", async () => {
		await orders.save(new OrderBuilder().withLine({ quantity: 2 }).build());

		expect((await placeOrder.handle({ audit, orderId: "ord_1" })).ok).toBe(true);

		const placed = new OrderPlaced({
			aggregateId: new OrderId("ord_1"),
			occurredAt: clock.now(),
			payload: { currency: "EUR", customerId: "cus_1", total: 2500 },
		});
		expect(orders.stored("ord_1")).toMatchObject({ data: { status: "placed" }, version: 2 });
		expect(events.published).toEqual([placed]);
		expect(notifications.published).toEqual([new Notification({ event: placed, id: "id_1", metadata: audit })]);
	});

	it("serializes notifications with their audit metadata", async () => {
		await orders.save(new OrderBuilder().withLine({ quantity: 2 }).build());

		await placeOrder.handle({ audit, orderId: "ord_1" });

		expect(JSON.parse(JSON.stringify(notifications.published))).toEqual([
			{
				event: {
					aggregateId: "ord_1",
					occurredAt: "2026-01-01T10:00:00.000Z",
					payload: { currency: "EUR", customerId: "cus_1", total: 2500 },
				},
				id: "id_1",
				metadata: { channel: "api", userId: "usr_7" },
				occurredAt: "2026-01-01T10:00:00.000Z",
				type: "OrderPlaced",
				version: 1,
			},
		]);
	});

	it("returns the business error and publishes nothing", async () => {
		await orders.save(new OrderBuilder().build());

		expect(await placeOrder.handle({ audit, orderId: "ord_1" })).toEqual({ error: new EmptyOrder(), ok: false });
		expect(orders.stored("ord_1")?.version).toBe(1);
		expect(events.published).toEqual([]);
		expect(notifications.published).toEqual([]);
	});
});
