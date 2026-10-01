import { describe, expect, it } from "vitest";

import { Order, OrderId, OrderNotFound } from "../../../test/fixtures/application.ts";
import { err, ok } from "../../utilities/result/index.ts";
import type { QueryHandler } from "./query-handler.ts";

interface GetOrder {
	readonly orderId: string;
}

interface OrderView {
	readonly id: string;
	readonly total: number;
}

const now = new Date("2026-01-01T00:00:00Z");

describe("QueryHandler", () => {
	const order = new Order(new OrderId("o1"));
	order.place(42, now);

	const getOrder: QueryHandler<GetOrder, OrderView, OrderNotFound> = {
		handle: ({ orderId }) =>
			Promise.resolve(
				orderId === order.id.value ? ok({ id: orderId, total: order.total }) : err(new OrderNotFound({ id: orderId })),
			),
	};

	it("returns what the caller reads", async () => {
		expect(await getOrder.handle({ orderId: "o1" })).toEqual(ok({ id: "o1", total: 42 }));
	});

	it("returns the domain errors it declares", async () => {
		expect(await getOrder.handle({ orderId: "o2" })).toEqual(err(new OrderNotFound({ id: "o2" })));
	});

	it("requires an output type and domain errors", () => {
		// @ts-expect-error
		const withoutOutput: QueryHandler<GetOrder> | undefined = undefined;
		// @ts-expect-error
		const withError: QueryHandler<GetOrder, OrderView, Error> | undefined = undefined;

		expect(withoutOutput).toBeUndefined();
		expect(withError).toBeUndefined();
	});
});
