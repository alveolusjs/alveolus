import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";

describe("ArchChecker", () => {
	it("runs the enabled rules and sorts the violations by file and line", () => {
		const codebase = new TestCodebase({ rules: { "layers/no-outward-import": "off" } })
			.file("src/ordering/driven/adapters/mailer.adapter.ts", "export class Mailer {}")
			.file("src/ordering/domain/order-id.ts", `import { Identifier } from "@alveolus/core";\nexport class OrderId extends Identifier<string, "OrderId"> {}`);

		expect(codebase.checkAllRules()).toEqual(["src/ordering/domain/order-id.ts:2 OrderId", "src/ordering/driven/adapters/mailer.adapter.ts:1 Mailer"]);
	});

	it("skips test files", () => {
		const codebase = new TestCodebase().file("src/ordering/driven/adapters/mailer.adapter.spec.ts", "export class MailerSpec {}");

		expect(codebase.checkAllRules()).toEqual([]);
	});
});
