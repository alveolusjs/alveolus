import { describe, expect, it } from "vitest";

import { CatalogApi } from "../../../test/fixtures/strategic.ts";

describe("OpenHostService", () => {
	it("marks the adapter that answers other contexts in the published language", () => {
		expect(new CatalogApi().product("p1")).toEqual({ id: "p1", name: "Espresso cup" });
	});
});
