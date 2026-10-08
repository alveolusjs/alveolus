import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import type { AlveolusConfig } from "../../config/index.ts";
import { NoUnmappedContextRule } from "./no-unmapped-context.rule.ts";

function bank(config: Partial<AlveolusConfig>, paymentsConsumesLedger: boolean, ledgerConsumesPayments: boolean): TestCodebase {
	const codebase = new TestCodebase({ boundedContexts: { ledger: "ledger", payments: "payments", reporting: "reporting" }, ...config })
		.file("src/ledger/driving/in-process/ledger-api.ts", `import type { OpenHostService } from "@alveolus/core";\nexport class LedgerApi implements OpenHostService {}`)
		.file("src/payments/driving/in-process/payments-api.ts", `import type { OpenHostService } from "@alveolus/core";\nexport class PaymentsApi implements OpenHostService {}`)
		.file(
			"src/reporting/driven/ledger/adapters/ledger-figures.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";\nimport type { LedgerApi } from "../../../../ledger/driving/in-process/ledger-api.ts";\nexport class LedgerFigures implements AntiCorruptionLayer { constructor(private readonly api: LedgerApi) {} }`,
		);
	if (paymentsConsumesLedger) {
		codebase.file(
			"src/payments/driven/ledger/adapters/ledger-balances.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";\nimport type { LedgerApi } from "../../../../ledger/driving/in-process/ledger-api.ts";\nexport class LedgerBalances implements AntiCorruptionLayer { constructor(private readonly api: LedgerApi) {} }`,
		);
	}
	if (ledgerConsumesPayments) {
		codebase.file(
			"src/ledger/driven/payments/adapters/payment-status.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";\nimport type { PaymentsApi } from "../../../../payments/driving/in-process/payments-api.ts";\nexport class PaymentStatus implements AntiCorruptionLayer { constructor(private readonly api: PaymentsApi) {} }`,
		);
	}
	return codebase;
}

describe("NoUnmappedContextRule", () => {
	it("accepts the consumptions the context map declares", () => {
		expect(bank({ contextMap: { payments: ["ledger"], reporting: ["ledger"] } }, true, false).check(new NoUnmappedContextRule())).toEqual([]);
	});

	it("rejects a consumption the context map does not declare", () => {
		expect(bank({ contextMap: { reporting: ["ledger"] } }, true, false).messages(new NoUnmappedContextRule())).toEqual([
			"payments consumes ledger, which the context map does not allow: add ledger to contextMap.payments, or reverse the dependency.",
		]);
	});

	it("without a context map, rejects the consumptions that close a cycle", () => {
		expect(bank({}, true, false).check(new NoUnmappedContextRule())).toEqual([]);
		expect(bank({}, true, true).check(new NoUnmappedContextRule())).toEqual([
			"src/payments/driven/ledger/adapters/ledger-balances.adapter.ts:2 LedgerApi",
			"src/ledger/driven/payments/adapters/payment-status.adapter.ts:2 PaymentsApi",
		]);
	});
});
