import { describe, expect, it } from "vitest";

import { InvalidTotal, Order, OrderId, OrderNotFound } from "../../../test/fixtures/application.ts";
import type { AnyDomainEvent } from "../../domain/domain-events/index.ts";
import { err, ok } from "../../utilities/result/index.ts";
import type { EventPublisher } from "../event-publishers/index.ts";
import type { CommandHandler } from "./command-handler.ts";

interface PlaceOrder {
	readonly orderId: string;
	readonly total: number;
}

const now = new Date("2026-01-01T00:00:00Z");

const placeOrder = (
	stored: Order,
	publisher: EventPublisher,
): CommandHandler<PlaceOrder, void, OrderNotFound | InvalidTotal> => ({
	handle: async ({ orderId, total }) => {
		if (orderId !== stored.id.value) {
			return err(new OrderNotFound({ id: orderId }));
		}
		const placed = stored.place(total, now);
		if (!placed.ok) {
			return placed;
		}
		await publisher.publish(stored.pullDomainEvents());
		return ok();
	},
});

describe("CommandHandler", () => {
	it("returns ok and lets the handler publish the events", async () => {
		const published: AnyDomainEvent[] = [];
		const publisher: EventPublisher = {
			publish: (events) => {
				published.push(...events);
				return Promise.resolve();
			},
		};

		const result = await placeOrder(new Order(new OrderId("o1")), publisher).handle({ orderId: "o1", total: 42 });

		expect(result).toEqual(ok());
		expect(published).toHaveLength(1);
	});

	it("returns the domain errors it declares", async () => {
		const publisher: EventPublisher = { publish: () => Promise.resolve() };
		const handler = placeOrder(new Order(new OrderId("o1")), publisher);

		expect(await handler.handle({ orderId: "o2", total: 42 })).toEqual(err(new OrderNotFound({ id: "o2" })));
		expect(await handler.handle({ orderId: "o1", total: 0 })).toEqual(err(new InvalidTotal({ total: 0 })));
	});

	it("may return data", async () => {
		const createOrder: CommandHandler<{ total: number }, OrderId> = {
			handle: () => Promise.resolve(ok(new OrderId("o1"))),
		};

		const result = await createOrder.handle({ total: 42 });

		expect(result.ok && result.value.value).toBe("o1");
	});

	it("only returns the domain errors it declares", () => {
		const handler: CommandHandler<PlaceOrder, void, InvalidTotal> = {
			// @ts-expect-error
			handle: () => Promise.resolve(err(new OrderNotFound({ id: "o1" }))),
		};
		// @ts-expect-error
		const withError: CommandHandler<PlaceOrder, void, Error> | undefined = undefined;

		expect(handler).toBeDefined();
		expect(withError).toBeUndefined();
	});

	it("succeeds with nothing by default", () => {
		const handler: CommandHandler<PlaceOrder> = {
			// @ts-expect-error
			handle: () => Promise.resolve(ok(42)),
		};

		expect(handler).toBeDefined();
	});
});
