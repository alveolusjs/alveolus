import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import type { AlveolusConfig } from "../../config/index.ts";
import { NoUnmappedContextRule } from "./no-unmapped-context.rule.ts";

function wired(app: string): TestCodebase {
	return new TestCodebase()
		.file(
			"src/catalog/driving/in-process/catalog-api.ts",
			`import type { OpenHostService } from "@alveolus/core";\nexport class CatalogApi implements OpenHostService { public price(id: string): number { return 1; } }`,
		)
		.file(
			"src/catalog/catalog.module.ts",
			`import { CatalogApi } from "./driving/in-process/catalog-api.ts";\nexport class CatalogModule { public readonly api = new CatalogApi(); public constructor(private readonly orders: () => { place(id: string): boolean }) {} }`,
		)
		.file("src/ordering/application/commands/place-order.command.ts", `export class PlaceOrderHandler { public place(id: string): boolean { return true; } }`)
		.file(
			"src/ordering/driven/catalog/adapters/catalog-prices.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";
import type { CatalogApi } from "../../../../catalog/driving/in-process/catalog-api.ts";
export class CatalogPrices implements AntiCorruptionLayer { public constructor(private readonly api: CatalogApi) {} }`,
		)
		.file(
			"src/ordering/ordering.module.ts",
			`import type { CatalogModule } from "../catalog/catalog.module.ts";
import { PlaceOrderHandler } from "./application/commands/place-order.command.ts";
import { CatalogPrices } from "./driven/catalog/adapters/catalog-prices.adapter.ts";
export class OrderingModule {
	public readonly placeOrder = new PlaceOrderHandler();
	public readonly prices: CatalogPrices;
	public constructor(catalog: CatalogModule) { this.prices = new CatalogPrices(catalog.api); }
}`,
		)
		.file("src/app.module.ts", app);
}

function bank(config: Partial<AlveolusConfig>, paymentsConsumesLedger: boolean, ledgerConsumesPayments: boolean): TestCodebase {
	const codebase = new TestCodebase({ boundedContexts: { ledger: "ledger", payments: "payments", reporting: "reporting" }, subdomains: { core: ["ledger", "payments", "reporting"] }, ...config })
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
		const contextMap = { ledger: { consumes: [] }, payments: { consumes: ["ledger"] }, reporting: { consumes: ["ledger"] } };

		expect(bank({ contextMap }, true, false).check(new NoUnmappedContextRule())).toEqual([]);
	});

	it("rejects a consumption the context map does not declare, and says to reverse it first", () => {
		const contextMap = { ledger: { consumes: [] }, payments: { consumes: [] }, reporting: { consumes: ["ledger"] } };

		expect(bank({ contextMap }, true, false).messages(new NoUnmappedContextRule())).toEqual([
			"payments consumes ledger, which the context map does not allow: reverse the dependency, or if payments really is downstream of ledger, add ledger to contextMap.payments.consumes.",
		]);
	});

	it("reports both ends of a consumption the map does not know, a cycle included", () => {
		const contextMap = { ledger: { consumes: [] }, payments: { consumes: [] }, reporting: { consumes: ["ledger"] } };

		expect(bank({ contextMap }, true, true).check(new NoUnmappedContextRule())).toEqual([
			"src/payments/driven/ledger/adapters/ledger-balances.adapter.ts:2 LedgerApi",
			"src/ledger/driven/payments/adapters/payment-status.adapter.ts:2 PaymentsApi",
		]);
	});

	it("reads the wiring: a value of one context given to another in a composition root is a consumption", () => {
		expect(
			wired(`import { CatalogModule } from "./catalog/catalog.module.ts";
import { OrderingModule } from "./ordering/ordering.module.ts";
export class AppModule {
	private readonly catalog = new CatalogModule(() => ({ place: () => true }));
	private readonly ordering = new OrderingModule(this.catalog);
}`).check(new NoUnmappedContextRule()),
		).toEqual([]);
		expect(
			wired(`import { CatalogModule } from "./catalog/catalog.module.ts";
import { OrderingModule } from "./ordering/ordering.module.ts";
export class AppModule {
	private readonly ordering: OrderingModule;
	private readonly catalog: CatalogModule;
	public constructor() {
		this.catalog = new CatalogModule(() => this.ordering.placeOrder);
		this.ordering = new OrderingModule(this.catalog);
		const handler = this.ordering.placeOrder;
		new CatalogModule(() => handler);
	}
}`).messages(new NoUnmappedContextRule()),
		).toEqual([
			"catalog receives this.ordering.placeOrder from ordering here, which the context map does not allow: reverse the dependency, or if catalog really is downstream of ordering, add ordering to contextMap.catalog.consumes.",
			"catalog receives handler from ordering here, which the context map does not allow: reverse the dependency, or if catalog really is downstream of ordering, add ordering to contextMap.catalog.consumes.",
		]);
	});
});
