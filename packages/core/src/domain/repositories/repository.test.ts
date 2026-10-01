import { describe, expect, it } from "vitest";

import {
	CustomerId,
	DatedShipment,
	InterfaceShipment,
	Order,
	OrderId,
	OrderLine,
	OrderLineId,
	ShipmentWithoutSnapshot,
} from "../../../test/fixtures/repository.ts";
import { ConcurrencyError } from "./concurrency-error.ts";
import type { Repository } from "./repository.ts";

interface OrderRepository extends Repository<Order> {}

describe("Repository", () => {
	it("loads aggregates by their own identifier type", async () => {
		const stored = new Order(new OrderId("o1"), 1);
		const orders: OrderRepository = {
			findById: async (id) => (id.equals(stored.id) ? stored : undefined),
			save: async () => {},
		};

		expect(await orders.findById(new OrderId("o1"))).toBe(stored);
		// @ts-expect-error
		await orders.findById(new CustomerId("o1"));
	});

	it("only stores aggregates", () => {
		// @ts-expect-error
		const ids: Repository<OrderId> | undefined = undefined;
		expect(ids).toBeUndefined();
	});
});

describe("ConcurrencyError", () => {
	it("describes the conflicting aggregate and versions", () => {
		const id = new OrderId("o1");

		const error = new ConcurrencyError(new Order(id, 2), 3);

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe("ConcurrencyError");
		expect(error.message).toBe("Cannot save Order o1: loaded at version 2, but the stored version is 3");
		expect(error).toMatchObject({ actualVersion: 3, aggregateId: id, aggregateType: "Order", expectedVersion: 2 });
	});
});

describe("snapshots", () => {
	it("export the state of an aggregate and its entities as JSON data", () => {
		const order = new Order(new OrderId("o1"), 3, [new OrderLine(new OrderLineId("l1"), 2)]);

		expect(order.toSnapshot()).toEqual({ id: "o1", lines: [{ id: "l1", quantity: 2 }] });
	});

	it("rebuild an equal aggregate", () => {
		const order = new Order(new OrderId("o1"), 3, [new OrderLine(new OrderLineId("l1"), 2)]);

		const rebuilt = Order.fromSnapshot(JSON.parse(JSON.stringify(order.toSnapshot())), 3);

		expect(rebuilt.equals(order)).toBe(true);
		expect(rebuilt.version).toBe(3);
		expect(rebuilt.toSnapshot()).toEqual(order.toSnapshot());
		expect(rebuilt.domainEvents).toEqual([]);
	});

	it("are required, JSON only and declared with a type alias", () => {
		expect([InterfaceShipment, DatedShipment, ShipmentWithoutSnapshot]).toHaveLength(3);
	});
});
