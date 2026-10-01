import { beforeEach, describe, expect, it } from "vitest";

import { FakeOrderRepository } from "../../../../test/fakes/order-repository.fake.ts";
import { InvalidCurrency } from "../../../shared-kernel/domain/errors/invalid-currency.error.ts";
import { CreateOrderHandler } from "./create-order.command.ts";

describe("CreateOrderHandler", () => {
	let orders: FakeOrderRepository;
	let createOrder: CreateOrderHandler;

	beforeEach(() => {
		orders = new FakeOrderRepository();
		createOrder = new CreateOrderHandler(orders);
	});

	it("saves an empty draft order", async () => {
		const result = await createOrder.handle({ currency: "EUR", customerId: "cus_1", orderId: "ord_1" });

		expect(result.ok).toBe(true);
		expect(orders.stored("ord_1")).toMatchObject({ data: { lines: [], status: "draft" }, version: 1 });
	});

	it("refuses an invalid currency and saves nothing", async () => {
		const result = await createOrder.handle({ currency: "euro", customerId: "cus_1", orderId: "ord_1" });

		expect(result).toEqual({ error: new InvalidCurrency({ currency: "euro" }), ok: false });
		expect(orders.size).toBe(0);
	});
});
