import { beforeEach, describe, expect, it } from "vitest";

import { OrderBuilder } from "../../../../test/builders/order.builder.ts";
import { FakeOrderRepository } from "../../../../test/fakes/order-repository.fake.ts";
import { InvalidCurrency } from "../../../shared-kernel/domain/errors/invalid-currency.error.ts";
import { CurrencyMismatch } from "../../domain/errors/currency-mismatch.error.ts";
import { OrderNotFound } from "../../domain/errors/order-not-found.error.ts";
import type { AddOrderLine } from "./add-order-line.command.ts";
import { AddOrderLineHandler } from "./add-order-line.command.ts";

const command: AddOrderLine = {
	lineId: "lin_1",
	orderId: "ord_1",
	productId: "prd_1",
	quantity: 2,
	unitPrice: { amount: 1250, currency: "EUR" },
};

describe("AddOrderLineHandler", () => {
	let orders: FakeOrderRepository;
	let addLine: AddOrderLineHandler;

	beforeEach(async () => {
		orders = new FakeOrderRepository();
		await orders.save(new OrderBuilder().build());
		addLine = new AddOrderLineHandler(orders);
	});

	it("adds the line and saves the order", async () => {
		expect((await addLine.handle(command)).ok).toBe(true);
		expect(orders.stored("ord_1")).toMatchObject({ data: { lines: [{ quantity: 2 }] }, version: 2 });
	});

	it("returns the errors of the price and of the order without saving", async () => {
		expect(await addLine.handle({ ...command, unitPrice: { amount: 1250, currency: "eur" } })).toEqual({
			error: new InvalidCurrency({ currency: "eur" }),
			ok: false,
		});
		expect(await addLine.handle({ ...command, unitPrice: { amount: 1250, currency: "USD" } })).toEqual({
			error: new CurrencyMismatch({ actual: "USD", expected: "EUR" }),
			ok: false,
		});
		expect(orders.stored("ord_1")?.version).toBe(1);
	});

	it("returns OrderNotFound for an unknown order", async () => {
		expect(await addLine.handle({ ...command, orderId: "ord_404" })).toEqual({
			error: new OrderNotFound({ orderId: "ord_404" }),
			ok: false,
		});
	});
});
