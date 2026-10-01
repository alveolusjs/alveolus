import { describe, expect, it } from "vitest";

import { reported } from "../fixtures.ts";

describe("repository rules", () => {
	it("reports repository implementations outside driven/", () => {
		expect(reported("domain/repositories/customer-store.ts")).toEqual([
			{
				line: 6,
				message: "CustomerStore implements a repository; declare it in a driven/ folder.",
				rule: "repository/adapter-location",
			},
		]);
	});
});
