import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import { NoImpureDomainRule } from "./no-impure-domain.rule.ts";
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
			.file("src/ordering/driven/pg/adapters/pg-orders.adapter.ts", `import { Order } from "../../../domain/aggregates/order.aggregate.ts";\nimport { Pool } from "pg";`)
			.file("src/ordering/driving/http/orders.controller.ts", `import { Controller } from "@nestjs/common";`)
			.file("src/ordering/ordering.module.ts", `import { PgOrders } from "./driven/pg/adapters/pg-orders.adapter.ts";`)
			.file("src/app.module.ts", `import { OrderingModule } from "./ordering/ordering.module.ts";`);

		expect(codebase.check(new NoOutwardImportRule())).toEqual([]);
	});

	it("keeps the application away from adapters and frameworks", () => {
		const codebase = new TestCodebase().file("src/ordering/driven/smtp/adapters/mailer.adapter.ts", `export class Mailer {}`).file(
			"src/ordering/application/commands/place-order.command.ts",
			`import { Injectable } from "@nestjs/common";
				import { Repository } from "typeorm";
				import { Mailer } from "../../driven/smtp/adapters/mailer.adapter.ts";`,
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
			.file("src/ordering/driven/smtp/adapters/mailer.adapter.ts", `export class Mailer {}`)
			.file("src/ordering/driving/http/orders.controller.ts", `import { Mailer } from "../../driven/smtp/adapters/mailer.adapter.ts";`);

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
			.file("src/ordering/driven/smtp/adapters/mailer.adapter.ts", `export class Mailer {}`)
			.file("src/ordering/driving/http/orders.controller.ts", `import { Mailer } from "../../driven/smtp/adapters/mailer.adapter.ts";`)
			.messages(new NoOutwardImportRule());

		expect(violations).toEqual([
			"The driving layer imports src/ordering/driven/smtp/adapters/mailer.adapter.ts (ordering driven): it may only import domain, application, published-language, driving.",
		]);
	});

	it("keeps the application away from files the analysis does not see", () => {
		const codebase = new TestCodebase().file("src/ordering/application/commands/fixtures.spec.ts", `export const order = {};`).file(
			"src/ordering/application/commands/place-order.command.ts",
			`import { order } from "./fixtures.spec.ts";
				import { mailer } from "./mailer.js";`,
		);

		expect(codebase.messages(new NoOutwardImportRule())).toEqual([
			"The application layer imports src/ordering/application/commands/fixtures.spec.ts (ignored by the analysis): it may only import domain, application, published-language.",
			"The application layer imports src/ordering/application/commands/mailer.js (not resolved by the analysis): it may only import domain, application, published-language.",
		]);
	});

	it("expects the documented folders under each layer, but keeps the layer of a misplaced file", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/legacy/v1/aggregates/order.aggregate.ts", `import { Pool } from "pg";`)
			.file("src/ordering/domain/index.ts", `export {};`)
			.file("src/ordering/domain/helpers/types.ts", `export type Cents = number;`)
			.file("src/ordering/application/mappers/order.mapper.ts", `export {};`)
			.file("src/ordering/published-language/v1/order.representation.ts", `export {};`)
			.file("src/ordering/driven/adapters/pg-orders.adapter.ts", `export {};`)
			.file("src/ordering/driven/pg/adapters/v1/pg-orders.adapter.ts", `export {};`)
			.file("src/ordering/driving/orders.controller.ts", `export {};`)
			.file("src/ordering/legacy/domain/aggregates/invoice.aggregate.ts", `export {};`)
			.file("src/ordering/driving/http/controllers/v1/orders.controller.ts", `export {};`)
			.file("src/shared-kernel/time/driven/system/adapters/system-clock.adapter.ts", `export {};`);

		expect(codebase.messages(new NoOutwardImportRule()).sort()).toEqual(
			[
				"The file is nested too deep: domain/ holds one folder per kind, such as domain/aggregates/.",
				"The file sits directly in domain/: put it in the folder of its kind, such as domain/aggregates/.",
				"domain/helpers/ is no folder of the domain: use aggregates/, entities/, value-objects/, events/, errors/, services/, repositories/, ports/, views/.",
				"application/mappers/ is no folder of the application: use commands/, queries/, translators/.",
				"The file is nested in published-language/: the published language holds its files directly.",
				"The file is not under a technology: driven/ holds driven/<technology>/<folder>/, such as driven/pg/adapters/.",
				"The file is nested too deep: driven/ holds driven/<technology>/<folder>/, such as driven/pg/adapters/.",
				"The file is not under a technology: driving/ holds driving/<technology>/, such as driving/http/.",
				"The file is outside the layers: move it to domain/, application/, published-language/, driven/ or driving/.",
			].sort(),
		);
		expect(codebase.messages(new NoImpureDomainRule())).toEqual(["The domain imports pg: add it to domainDependencies if the domain really needs it."]);
	});

	it("keeps one composition root per context", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/ordering.module.ts", `export class OrderingModule {}`)
			.file("src/ordering/pricing.module.ts", `export class PricingRules {}`)
			.file("src/catalog/catalog.module.ts", `export class CatalogModule {}`);

		expect(codebase.messages(new NoOutwardImportRule())).toEqual([
			"ordering has 2 composition roots (ordering.module.ts, pricing.module.ts): keep one, and move the rest into the layers.",
			"ordering has 2 composition roots (ordering.module.ts, pricing.module.ts): keep one, and move the rest into the layers.",
		]);
	});
});
