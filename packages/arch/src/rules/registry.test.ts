import { describe, expect, it } from "vitest";

import { RuleRegistry, ruleIds } from "./registry.ts";

describe("RuleRegistry", () => {
	it("holds one rule per id, in the order of the ids", () => {
		expect(new RuleRegistry().ids).toEqual([...ruleIds]);
	});

	it("applies the strategic and tooling rules to every bounded context, the layers and tactical ones to the core domain only", () => {
		for (const rule of new RuleRegistry().rules) {
			const category = rule.meta.id.split("/")[0];
			const expected = category === "strategic" || category === "tooling" ? "every" : "core";

			expect(rule.meta.contexts, rule.meta.id).toBe(expected);
		}
	});
});
