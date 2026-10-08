import { describe, expect, it } from "vitest";

import { RuleRegistry, ruleIds } from "./registry.ts";

describe("RuleRegistry", () => {
	it("holds one rule per id, in the order of the ids", () => {
		expect(new RuleRegistry().ids).toEqual([...ruleIds]);
	});
});
