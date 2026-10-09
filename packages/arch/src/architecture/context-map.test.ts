import { describe, expect, it } from "vitest";

import { ContextMap } from "./context-map.ts";

describe("ContextMap", () => {
	it("says which context may consume which", () => {
		const map = new ContextMap({ ledger: [], payments: ["ledger"] });

		expect(map.allows("payments", "ledger")).toBe(true);
		expect(map.allows("ledger", "payments")).toBe(false);
		expect(map.contexts.sort()).toEqual(["ledger", "payments"]);
	});

	it("finds a cycle, and the path that closes it", () => {
		expect(new ContextMap({ ledger: ["reporting"], payments: ["ledger"], reporting: ["payments"] }).cycle()).toEqual(["ledger", "reporting", "payments", "ledger"]);
		expect(new ContextMap({ ledger: [], payments: ["ledger"] }).cycle()).toBeUndefined();
	});

	it("names the contexts consumed, and the ones that consume themselves", () => {
		const map = new ContextMap({ ledger: ["ledger"], payments: ["ledger", "customers"] });

		expect(map.consumed.sort()).toEqual(["customers", "ledger"]);
		expect(map.selfConsumers()).toEqual(["ledger"]);
	});
});
