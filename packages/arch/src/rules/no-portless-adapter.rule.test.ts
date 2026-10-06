import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";
import { NoPortlessAdapterRule } from "./no-portless-adapter.rule.ts";

describe("NoPortlessAdapterRule", () => {
	it("accepts adapters extending a port, a repository or a port of core", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/ports/payments.port.ts", `import { Port } from "@alveolus/core";\nexport abstract class Payments extends Port {}`)
			.file("src/ordering/driven/adapters/stripe-payments.adapter.ts", `import { Payments } from "../../domain/ports/payments.port.ts";\nexport class StripePayments extends Payments {}`)
			.file("src/shared-kernel/driven/adapters/system-clock.adapter.ts", `import { Clock } from "@alveolus/core";\nexport class SystemClock extends Clock { now(): Date { return new Date(); } }`);

		expect(codebase.check(new NoPortlessAdapterRule())).toEqual([]);
	});

	it("rejects an adapter that extends no port", () => {
		const codebase = new TestCodebase().file("src/ordering/driven/adapters/mailer.adapter.ts", `export class Mailer {}`);

		expect(codebase.check(new NoPortlessAdapterRule())).toEqual(["src/ordering/driven/adapters/mailer.adapter.ts:1 Mailer"]);
	});

	it("rejects a port declared outside the domain", () => {
		const codebase = new TestCodebase().file("src/ordering/application/commands/payments.ts", `import { Port } from "@alveolus/core";\nexport abstract class Payments extends Port {}`);

		expect(codebase.check(new NoPortlessAdapterRule())).toEqual(["src/ordering/application/commands/payments.ts:2 Payments"]);
	});
});
