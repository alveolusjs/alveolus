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

	it("builds itself from observed consumptions and tells which ones close a cycle", () => {
		const map = ContextMap.ofEdges([
			{ from: "payments", to: "ledger" },
			{ from: "ledger", to: "payments" },
			{ from: "reporting", to: "ledger" },
		]);

		expect(map.cycleThrough("payments", "ledger")).toBe(true);
		expect(map.cycleThrough("reporting", "ledger")).toBe(false);
	});
});
