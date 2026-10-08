import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import { ruleIds } from "../registry.ts";
import { NoLooseDisableRule } from "./no-loose-disable.rule.ts";

describe("NoLooseDisableRule", () => {
	it("accepts a comment that names a rule and gives a reason", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/services/pricing.service.ts",
			`// alveolus-disable-next-line layers/no-impure-domain: legacy pool, ticket ORD-412\nimport { Pool } from "pg";`,
		);

		expect(codebase.check(new NoLooseDisableRule(ruleIds))).toEqual([]);
	});

	it("rejects a comment without a rule, with an unknown rule, or without a reason", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/services/pricing.service.ts",
			`// alveolus-disable-next-line
			import { Pool } from "pg";
			// alveolus-disable-next-line layers/no-such-rule: reason
			import { Client } from "pg";
			// alveolus-disable-next-line layers/no-impure-domain
			import { Query } from "pg";`,
		);

		expect(codebase.messages(new NoLooseDisableRule(ruleIds))).toEqual([
			"The disable comment names no rule: write `// alveolus-disable-next-line <rule-id>: <reason>`.",
			"The disable comment names layers/no-such-rule, which is no rule: check the id on the rules page.",
			"The disable comment gives no reason: write `// alveolus-disable-next-line layers/no-impure-domain: <why this line keeps its violation>`.",
		]);
	});
});
