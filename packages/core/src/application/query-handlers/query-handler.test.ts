import { describe, expect, it } from "vitest";

import type { GetOrderSummary } from "../../../test/fixtures/application.ts";
import { GetOrderSummaryHandler, InMemoryOrderSummaries, OrderNotFound } from "../../../test/fixtures/application.ts";
import { err, ok } from "../../utilities/result/index.ts";
import { QueryHandler } from "./query-handler.ts";

describe("QueryHandler", () => {
	const handler = new GetOrderSummaryHandler(new InMemoryOrderSummaries([{ id: "o1", total: 42 }]));

	it("returns the view it reads", async () => {
		expect(await handler.handle({ orderId: "o1" })).toEqual(ok({ id: "o1", total: 42 }));
		expect(handler).toBeInstanceOf(QueryHandler);
	});

	it("returns the domain errors it declares", async () => {
		expect(await handler.handle({ orderId: "o2" })).toEqual(err(new OrderNotFound({ id: "o2" })));
	});

	it("requires its output type and only accepts domain errors", () => {
		// @ts-expect-error
		const withoutOutput: QueryHandler<GetOrderSummary> | undefined = undefined;
		// @ts-expect-error
		const withError: QueryHandler<GetOrderSummary, number, Error> | undefined = undefined;

		expect(withoutOutput).toBeUndefined();
		expect(withError).toBeUndefined();
	});
});
