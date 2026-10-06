import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";
import { NoImpureDomainRule } from "./no-impure-domain.rule.ts";

describe("NoImpureDomainRule", () => {
	it("lets the domain import its own domain, the shared kernel domain and the domain API of core", () => {
		const codebase = new TestCodebase()
			.file("src/shared-kernel/domain/value-objects/money.value-object.ts", `export class Money {}`)
			.file("src/ordering/domain/value-objects/order-id.identifier.ts", `export class OrderId {}`)
			.file(
				"src/ordering/domain/aggregates/order.aggregate.ts",
				`import { AggregateRoot, ok, type Result } from "@alveolus/core";
				import { Money } from "../../../shared-kernel/domain/value-objects/money.value-object.ts";
				import { OrderId } from "../value-objects/order-id.identifier.ts";`,
			);

		expect(codebase.check(new NoImpureDomainRule())).toEqual([]);
	});

	it("rejects application symbols of core", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/aggregates/order.aggregate.ts", `import { AggregateRoot, UnitOfWork } from "@alveolus/core";`);

		expect(codebase.check(new NoImpureDomainRule())).toEqual(["src/ordering/domain/aggregates/order.aggregate.ts:1 AggregateRoot, UnitOfWork"]);
	});

	it("rejects other layers", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/application/commands/place-order.command.ts", `export class PlaceOrderHandler {}`)
			.file("src/ordering/domain/aggregates/order.aggregate.ts", `import { PlaceOrderHandler } from "../../application/commands/place-order.command.ts";`);

		expect(codebase.check(new NoImpureDomainRule())).toEqual(["src/ordering/domain/aggregates/order.aggregate.ts:1 PlaceOrderHandler"]);
	});

	it("rejects packages unless they are declared in domainDependencies", () => {
		const source = `import { Entity } from "typeorm";\nimport Decimal from "decimal.js";`;

		expect(new TestCodebase().file("src/ordering/domain/aggregates/order.aggregate.ts", source).check(new NoImpureDomainRule())).toEqual([
			"src/ordering/domain/aggregates/order.aggregate.ts:1 Entity",
			"src/ordering/domain/aggregates/order.aggregate.ts:2 default",
		]);
		expect(new TestCodebase({ domainDependencies: { "decimal.js": true } }).file("src/ordering/domain/aggregates/order.aggregate.ts", source).check(new NoImpureDomainRule())).toEqual([
			"src/ordering/domain/aggregates/order.aggregate.ts:1 Entity",
		]);
	});

	it("limits a package to the names declared in domainDependencies", () => {
		const messages = new TestCodebase({ domainDependencies: { "date-fns": ["addDays"] } })
			.file("src/ordering/domain/aggregates/order.aggregate.ts", `import { addDays, format } from "date-fns";`)
			.messages(new NoImpureDomainRule());

		expect(messages).toEqual(["The domain imports format from date-fns: domainDependencies only allows addDays."]);
	});
});
