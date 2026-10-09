import { describe, expect, it } from "vitest";

import { ContextMap } from "./context-map.ts";

describe("ContextMap", () => {
	it("says which context may consume which", () => {
		const map = new ContextMap({ catalog: [], ordering: ["catalog"] });

		expect(map.allows("ordering", "catalog")).toBe(true);
		expect(map.allows("catalog", "ordering")).toBe(false);
		expect(map.contexts.sort()).toEqual(["catalog", "ordering"]);
	});

	it("finds a cycle, and the path that closes it", () => {
		expect(new ContextMap({ catalog: ["reporting"], ordering: ["catalog"], reporting: ["ordering"] }).cycle()).toEqual(["catalog", "reporting", "ordering", "catalog"]);
		expect(new ContextMap({ catalog: [], ordering: ["catalog"] }).cycle()).toBeUndefined();
	});

	it("names the contexts consumed, and the ones that consume themselves", () => {
		const map = new ContextMap({ catalog: ["catalog"], ordering: ["catalog", "customers"] });

		expect(map.consumed.sort()).toEqual(["catalog", "customers"]);
		expect(map.selfConsumers()).toEqual(["catalog"]);
	});
});
