import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";
import { NoOutwardImportRule } from "./no-outward-import.rule.ts";

describe("NoOutwardImportRule", () => {
	it("lets each layer import the layers below it", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/aggregates/order.aggregate.ts", `export class Order {}`)
			.file("src/ordering/published-language/order-placed.representation.ts", `import type { PublishedLanguage } from "@alveolus/core";`)
			.file(
				"src/ordering/application/commands/place-order.command.ts",
				`import { CommandHandler } from "@alveolus/core";
				import { Order } from "../../domain/aggregates/order.aggregate.ts";`,
			)
			.file("src/ordering/application/translators/order-events.translator.ts", `import type { OrderPlacedRepresentation } from "../../published-language/order-placed.representation.ts";`)
			.file("src/ordering/driven/adapters/pg-orders.adapter.ts", `import { Order } from "../../domain/aggregates/order.aggregate.ts";\nimport { Pool } from "pg";`)
			.file("src/ordering/driving/http/orders.controller.ts", `import { Controller } from "@nestjs/common";`)
			.file("src/ordering/ordering.module.ts", `import { PgOrders } from "./driven/adapters/pg-orders.adapter.ts";`)
			.file("src/app.module.ts", `import { OrderingModule } from "./ordering/ordering.module.ts";`);

		expect(codebase.check(new NoOutwardImportRule())).toEqual([]);
	});

	it("keeps the application away from adapters and frameworks", () => {
		const codebase = new TestCodebase().file("src/ordering/driven/adapters/mailer.adapter.ts", `export class Mailer {}`).file(
			"src/ordering/application/commands/place-order.command.ts",
			`import { Injectable } from "@nestjs/common";
				import { Repository } from "typeorm";
				import { Mailer } from "../../driven/adapters/mailer.adapter.ts";`,
		);

		expect(codebase.check(new NoOutwardImportRule())).toEqual([
			"src/ordering/application/commands/place-order.command.ts:1 Injectable",
			"src/ordering/application/commands/place-order.command.ts:2 Repository",
			"src/ordering/application/commands/place-order.command.ts:3 Mailer",
		]);
	});

	it("accepts the packages declared in domainDependencies and applicationDependencies", () => {
		const codebase = new TestCodebase({ applicationDependencies: { "@nestjs/common": true }, domainDependencies: { "decimal.js": true } }).file(
			"src/ordering/application/commands/place-order.command.ts",
			`import { Injectable } from "@nestjs/common";
				import Decimal from "decimal.js";
				import { Repository } from "typeorm";`,
		);

		expect(codebase.check(new NoOutwardImportRule())).toEqual(["src/ordering/application/commands/place-order.command.ts:3 Repository"]);
	});

	it("limits a package to the names declared in applicationDependencies", () => {
		const messages = new TestCodebase({ applicationDependencies: { "@nestjs/common": ["Injectable"] } })
			.file("src/ordering/application/commands/place-order.command.ts", `import { Controller, Injectable } from "@nestjs/common";`)
			.messages(new NoOutwardImportRule());

		expect(messages).toEqual(["The application imports Controller from @nestjs/common: applicationDependencies only allows Injectable."]);
	});

	it("keeps driven and driving adapters apart", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/driven/adapters/mailer.adapter.ts", `export class Mailer {}`)
			.file("src/ordering/driving/http/orders.controller.ts", `import { Mailer } from "../../driven/adapters/mailer.adapter.ts";`);

		expect(codebase.check(new NoOutwardImportRule())).toEqual(["src/ordering/driving/http/orders.controller.ts:1 Mailer"]);
	});

	it("leaves the wiring to the composition root", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/ordering.module.ts", `export class OrderingModule {}`)
			.file("src/ordering/driving/http/orders.controller.ts", `import { OrderingModule } from "../../ordering.module.ts";`)
			.file("src/ordering/domain/aggregates/order.aggregate.ts", `export class Order {}`)
			.file("src/main.ts", `import { Order } from "./ordering/domain/aggregates/order.aggregate.ts";`);

		expect(codebase.check(new NoOutwardImportRule())).toEqual(["src/main.ts:1 Order", "src/ordering/driving/http/orders.controller.ts:1 OrderingModule"]);
	});

	it("keeps the published language to its own types", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/aggregates/order.aggregate.ts", `export class Order {}`).file(
			"src/ordering/published-language/order.representation.ts",
			`import type { AggregateRoot, PublishedLanguage } from "@alveolus/core";
				import type { Order } from "../domain/aggregates/order.aggregate.ts";`,
		);

		expect(codebase.check(new NoOutwardImportRule())).toEqual([
			"src/ordering/published-language/order.representation.ts:1 AggregateRoot, PublishedLanguage",
			"src/ordering/published-language/order.representation.ts:2 Order",
		]);
	});

	it("reports files outside the layers and the declared contexts", () => {
		const codebase = new TestCodebase().file("src/ordering/helpers.ts", `export const helper = 1;`).file("src/common/strings.ts", `export const empty = "";`);

		expect(codebase.check(new NoOutwardImportRule())).toEqual(["src/ordering/helpers.ts:1 helpers.ts", "src/common/strings.ts:1 strings.ts"]);
	});

	it("names the file it imports in the message", () => {
		const violations = new TestCodebase()
			.file("src/ordering/driven/adapters/mailer.adapter.ts", `export class Mailer {}`)
			.file("src/ordering/driving/http/orders.controller.ts", `import { Mailer } from "../../driven/adapters/mailer.adapter.ts";`)
			.messages(new NoOutwardImportRule());

		expect(violations).toEqual(["The driving layer imports src/ordering/driven/adapters/mailer.adapter.ts (ordering driven): it may only import domain, application, published-language, driving."]);
	});
});
