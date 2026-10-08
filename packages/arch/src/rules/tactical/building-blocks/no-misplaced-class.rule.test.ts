import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../test/support/test-codebase.ts";
import { NoMisplacedClassRule } from "./no-misplaced-class.rule.ts";

describe("NoMisplacedClassRule", () => {
	it("accepts each building block in its folder with its suffix", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/value-objects/order-id.identifier.ts", `import { Identifier } from "@alveolus/core";\nexport class OrderId extends Identifier<string, "OrderId"> {}`)
			.file("src/ordering/domain/errors/invalid-total.error.ts", `import { DomainError } from "@alveolus/core";\nexport class InvalidTotal extends DomainError {}`)
			.file("src/ordering/domain/ports/payments.port.ts", `import { Port } from "@alveolus/core";\nexport abstract class Payments extends Port {}`)
			.file("src/ordering/driven/stripe/adapters/stripe-payments.adapter.ts", `import { Payments } from "../../../domain/ports/payments.port.ts";\nexport class StripePayments extends Payments {}`)
			.file("src/ordering/driving/http/orders.controller.ts", `export class OrdersController {}`);

		expect(codebase.check(new NoMisplacedClassRule())).toEqual([]);
	});

	it("rejects a building block in the wrong folder or with the wrong suffix", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/order-id.ts", `import { Identifier } from "@alveolus/core";\nexport class OrderId extends Identifier<string, "OrderId"> {}`)
			.file("src/ordering/domain/ports/payments.ts", `import { Port } from "@alveolus/core";\nexport abstract class Payments extends Port {}`);

		expect(codebase.check(new NoMisplacedClassRule())).toEqual(["src/ordering/domain/order-id.ts:2 OrderId", "src/ordering/domain/ports/payments.ts:2 Payments"]);
	});

	it("allows one class per file", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/errors/order.error.ts",
			`import { DomainError } from "@alveolus/core";
			export class InvalidTotal extends DomainError {}
			export class OrderAlreadyPlaced extends DomainError {}`,
		);

		expect(codebase.check(new NoMisplacedClassRule())).toEqual(["src/ordering/domain/errors/order.error.ts:3 OrderAlreadyPlaced"]);
	});

	it("places a marked class by its marker, whatever it extends", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/ports/price-list.port.ts", `import { Port } from "@alveolus/core";\nexport abstract class PriceList extends Port {}`)
			.file(
				"src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts",
				`import type { AntiCorruptionLayer } from "@alveolus/core";
				import { PriceList } from "../../../domain/ports/price-list.port.ts";
				export class CatalogPriceList extends PriceList implements AntiCorruptionLayer {}`,
			)
			.file("src/ordering/driving/in-process/ordering-api.ts", `import type { OpenHostService } from "@alveolus/core";\nexport class OrderingApi implements OpenHostService {}`)
			.file(
				"src/ordering/application/commands/place-order.command.ts",
				`import { CommandHandler, type AntiCorruptionLayer } from "@alveolus/core";
				export abstract class PlaceOrderHandler extends CommandHandler<void> implements AntiCorruptionLayer {}`,
			)
			.file(
				"src/ordering/domain/aggregates/order.aggregate.ts",
				`import { AggregateRoot, type OpenHostService } from "@alveolus/core";
				export abstract class Order extends AggregateRoot<never> implements OpenHostService {}`,
			);

		expect(codebase.messages(new NoMisplacedClassRule()).sort()).toEqual([
			"Order implements OpenHostService: it belongs in driving/<technology>/.",
			"PlaceOrderHandler implements AntiCorruptionLayer: it belongs in driven/<technology>/adapters/*.adapter.ts, as an adapter of a port.",
		]);
	});
});
