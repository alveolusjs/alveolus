import { describe, expect, it } from "vitest";

import { FakeImporter } from "../../test/support/fake-importer.ts";
import { TestCodebase } from "../../test/support/test-codebase.ts";
import { Config } from "../config/index.ts";
import { RuleRegistry } from "../rules/index.ts";
import { Checker } from "./checker.ts";

describe("Checker", () => {
	it("runs the enabled rules and sorts the violations by file and line", () => {
		const codebase = new TestCodebase({ rules: { "layers/no-outward-import": "off" } })
			.file("src/ordering/driven/adapters/mailer.adapter.ts", "export class Mailer {}")
			.file("src/ordering/domain/order-id.ts", `import { Identifier } from "@alveolus/core";\nexport class OrderId extends Identifier<string, "OrderId"> {}`);

		expect(codebase.checkAllRules()).toEqual(["src/ordering/domain/order-id.ts:2 OrderId", "src/ordering/driven/adapters/mailer.adapter.ts:1 Mailer"]);
	});

	it("skips test files", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/ordering.module.ts", "export class OrderingModule {}")
			.file("src/ordering/driven/adapters/mailer.adapter.spec.ts", "export class MailerSpec {}");

		expect(codebase.checkAllRules()).toEqual([]);
	});

	it("refuses to check a project from which @alveolus/core cannot be imported", () => {
		const config = new Config({ boundedContexts: {}, root: "src" }, "/project");

		expect(() => new Checker(new FakeImporter(false), []).check(config)).toThrow(`@alveolus/core cannot be imported from ${config.rootDir}`);
		expect(new Checker(new FakeImporter(true), []).check(config)).toEqual({ files: 1, suppressed: [], violations: [] });
	});

	it("turns a violation off under a complete disable comment, and reports a comment that disables nothing", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/services/pricing.service.ts",
			`// alveolus-disable-next-line layers/no-impure-domain: legacy pool
			import { Pool } from "pg";
			// alveolus-disable-next-line layers/no-impure-domain: nothing here
			import { DomainService } from "@alveolus/core";
			export class Pricing extends DomainService {}`,
		);
		const outcome = new Checker(codebase.importer, new RuleRegistry().rules).check(codebase.config);

		expect(outcome.suppressed.map(({ reason, violation }) => [violation.line, violation.rule, reason])).toEqual([[2, "layers/no-impure-domain", "legacy pool"]]);
		expect(outcome.violations.map((violation) => [violation.line, violation.rule])).toEqual([[3, "tooling/no-loose-disable"]]);
	});
});
