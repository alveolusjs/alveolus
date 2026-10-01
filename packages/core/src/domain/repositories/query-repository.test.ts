import { describe, expect, it } from "vitest";

import { InMemoryOrderSummaries } from "../../../test/fixtures/application.ts";
import { Port } from "../ports/index.ts";
import { QueryRepository } from "./query-repository.ts";

describe("QueryRepository", () => {
	it("is a port that reads views", async () => {
		const summaries = new InMemoryOrderSummaries([{ id: "o1", total: 42 }]);

		expect(await summaries.summaryOf("o1")).toEqual({ id: "o1", total: 42 });
		expect(summaries).toBeInstanceOf(QueryRepository);
		expect(summaries).toBeInstanceOf(Port);
	});

	it("holds an object", () => {
		// @ts-expect-error
		const ofNumber: QueryRepository<number> | undefined = undefined;

		expect(ofNumber).toBeUndefined();
	});
});
