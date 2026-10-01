import { describe, expect, it } from "vitest";

import { Order, OrderId, OrderPlaced } from "../../../test/fixtures/application.ts";
import type { AnyNotification, NotificationPublisher } from "./index.ts";
import { Notification } from "./index.ts";

interface Audit {
	readonly userId: string;
	readonly channel: "api" | "cli";
}

const occurredAt = new Date("2026-01-01T00:00:00Z");

const placed = (): OrderPlaced =>
	new OrderPlaced({ aggregateId: new OrderId("o1"), occurredAt, payload: { total: 42 } });

describe("Notification", () => {
	it("wraps a domain event with an id, its type, its date and version 1", () => {
		const event = placed();

		const notification = new Notification({ event, id: "n1", metadata: {} });

		expect(notification).toMatchObject({ event, id: "n1", occurredAt, type: "OrderPlaced", version: 1 });
	});

	it("keeps the event type", () => {
		const notification = new Notification({ event: placed(), id: "n1", metadata: {} });

		const payload: { total: number } = notification.event.payload;

		expect(payload.total).toBe(42);
	});

	it("takes the version of the event format", () => {
		expect(new Notification({ event: placed(), id: "n1", metadata: {}, version: 2 }).version).toBe(2);
	});

	it("rejects a version that is not a positive integer", () => {
		expect(() => new Notification({ event: placed(), id: "n1", metadata: {}, version: 0 })).toThrow(
			new RangeError("Notification version must be a positive integer, got 0"),
		);
		expect(() => new Notification({ event: placed(), id: "n1", metadata: {}, version: 1.5 })).toThrow(RangeError);
	});

	it("serializes to plain JSON", () => {
		const notification = new Notification({ event: placed(), id: "n1", metadata: {} });

		expect(JSON.parse(JSON.stringify(notification))).toEqual({
			event: { aggregateId: "o1", occurredAt: "2026-01-01T00:00:00.000Z", payload: { total: 42 } },
			id: "n1",
			metadata: {},
			occurredAt: "2026-01-01T00:00:00.000Z",
			type: "OrderPlaced",
			version: 1,
		});
	});

	it("is published after the aggregate is saved", async () => {
		const order = new Order(new OrderId("o1"));
		order.place(42, occurredAt);
		const published: AnyNotification[] = [];
		const publisher: NotificationPublisher = {
			publish: (notifications) => {
				published.push(...notifications);
				return Promise.resolve();
			},
		};

		await publisher.publish(
			order.pullDomainEvents().map((event) => new Notification({ event, id: "n1", metadata: {} })),
		);

		expect(published).toEqual([new Notification({ event: placed(), id: "n1", metadata: {} })]);
	});

	it("carries empty metadata", () => {
		const notification = new Notification({ event: placed(), id: "n1", metadata: {} });

		expect(notification.metadata).toEqual({});
		// @ts-expect-error
		new Notification({ event: placed(), id: "n1" });
	});

	it("infers the metadata it receives", () => {
		const notification = new Notification({ event: placed(), id: "n1", metadata: { userId: "u1" } });

		const userId: string = notification.metadata.userId;

		expect(userId).toBe("u1");
	});

	it("carries the metadata it declares", () => {
		const notification = new Notification<OrderPlaced, Audit>({
			event: placed(),
			id: "n1",
			metadata: { channel: "api", userId: "u1" },
		});

		const userId: string = notification.metadata.userId;

		expect(userId).toBe("u1");
		expect(JSON.parse(JSON.stringify(notification))).toMatchObject({ metadata: { channel: "api", userId: "u1" } });
		// @ts-expect-error
		new Notification<OrderPlaced, Audit>({ event: placed(), id: "n1", metadata: { userId: "u1" } });
		// @ts-expect-error
		new Notification({ event: placed(), id: "n1", metadata: "u1" });
	});

	it("is published with typed metadata", async () => {
		const users: string[] = [];
		const publisher: NotificationPublisher<Audit> = {
			publish: (notifications) => {
				users.push(...notifications.map((notification) => notification.metadata.userId));
				return Promise.resolve();
			},
		};

		await publisher.publish([
			new Notification({ event: placed(), id: "n1", metadata: { channel: "api", userId: "u1" } }),
		]);
		const emptyMetadata = (): Promise<void> =>
			// @ts-expect-error
			publisher.publish([new Notification({ event: placed(), id: "n2", metadata: {} })]);

		expect(users).toEqual(["u1"]);
		expect(emptyMetadata).toBeTypeOf("function");
	});
});
