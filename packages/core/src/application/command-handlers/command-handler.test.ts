import { beforeEach, describe, expect, it } from "vitest";

import type { PlaceOrder } from "../../../test/fixtures/application.ts";
import {
	CreateOrderHandler,
	FixedClock,
	InMemoryOrders,
	InvalidTotal,
	Order,
	OrderEventsTranslator,
	OrderId,
	OrderNotFound,
	PlaceOrderHandler,
	SequentialIdGenerator,
} from "../../../test/fixtures/application.ts";
import { InMemoryOutbox } from "../../../test/fixtures/utilities.ts";
import { err, ok } from "../../utilities/result/index.ts";
import { CommandHandler } from "./command-handler.ts";

describe("CommandHandler", () => {
	let outbox: InMemoryOutbox;
	let handler: PlaceOrderHandler;

	beforeEach(async () => {
		const orders = new InMemoryOrders();
		await orders.save(new Order(new OrderId("o1")));
		outbox = new InMemoryOutbox();
		handler = new PlaceOrderHandler(orders, outbox, new OrderEventsTranslator(), new FixedClock(new Date()), new SequentialIdGenerator());
	});

	it("returns ok and adds the translated events to the outbox after saving", async () => {
		expect(await handler.handle({ orderId: "o1", total: 42 })).toEqual(ok());
		expect(await outbox.pending(10)).toHaveLength(1);
		expect(handler).toBeInstanceOf(CommandHandler);
	});

	it("returns the domain errors it declares", async () => {
		expect(await handler.handle({ orderId: "o2", total: 42 })).toEqual(err(new OrderNotFound({ id: "o2" })));
		expect(await handler.handle({ orderId: "o1", total: 0 })).toEqual(err(new InvalidTotal({ total: 0 })));
	});

	it("may return data", async () => {
		const result = await new CreateOrderHandler().handle({ orderId: "o1" });

		expect(result.ok && result.value.value).toBe("o1");
	});

	it("only accepts domain errors and succeeds with nothing by default", () => {
		// @ts-expect-error
		const withError: CommandHandler<PlaceOrder, void, Error> | undefined = undefined;
		const handler: CommandHandler<PlaceOrder> | undefined = undefined;

		expect(withError).toBeUndefined();
		expect(handler).toBeUndefined();
	});
});
