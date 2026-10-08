import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
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

	it("reads import types, dynamic imports and require calls as imports", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/services/pricing.service.ts",
			`type Pool = import("pg").Pool;
			type Work = import("@alveolus/core").UnitOfWork;
			const lazy = () => import("pg");
			const required = require("pg");
			import legacy = require("pg");`,
		);

		expect(codebase.check(new NoImpureDomainRule())).toEqual([
			"src/ordering/domain/services/pricing.service.ts:1 Pool",
			"src/ordering/domain/services/pricing.service.ts:2 UnitOfWork",
			"src/ordering/domain/services/pricing.service.ts:3 *",
			"src/ordering/domain/services/pricing.service.ts:4 *",
			"src/ordering/domain/services/pricing.service.ts:5 *",
		]);
	});

	it("lets a dynamic import reach the domain", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/value-objects/money.value-object.ts", `export class Money {}`)
			.file("src/ordering/domain/services/pricing.service.ts", `const lazy = () => import("../value-objects/money.value-object.ts");`);

		expect(codebase.check(new NoImpureDomainRule())).toEqual([]);
	});

	it("rejects files the analysis does not see: ignored, unresolved or computed at runtime", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/domain/services/__tests__/pg.ts", `import { Pool } from "pg";\nexport const pool = new Pool();`)
			.file("src/ordering/domain/services/db.spec.ts", `export const db = 1;`)
			.file(
				"src/ordering/domain/services/pricing.service.ts",
				`import { pool } from "./__tests__/pg.ts";
				import { db } from "./db.spec.ts";
				import { cache } from "./cache.js";
				const plugin = (name: string) => import("./plugins/" + name);`,
			);

		expect(codebase.messages(new NoImpureDomainRule())).toEqual([
			"The domain imports src/ordering/domain/services/__tests__/pg.ts (ignored by the analysis): it may only import the domain.",
			"The domain imports src/ordering/domain/services/db.spec.ts (ignored by the analysis): it may only import the domain.",
			"The domain imports src/ordering/domain/services/cache.js (not resolved by the analysis): it may only import the domain.",
			'The domain imports src/ordering/domain/services/"./plugins/" + name (not resolved by the analysis): it may only import the domain.',
		]);
	});

	it("lets the domain use the ECMAScript built-ins", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/services/pricing.service.ts",
			`export const prices = new Map<string, number[]>();
			export const total = Math.max(...[1, 2]) + JSON.stringify([]).length + Number("1");
			export const placedAt = new Date("2026-01-01T00:00:00Z");
			export const format = new Intl.NumberFormat("fr-FR");
			export async function later(): Promise<readonly string[]> { return Array.from(prices.keys()); }`,
		);

		expect(codebase.check(new NoImpureDomainRule())).toEqual([]);
	});

	it("rejects the globals of the host, but not a local variable of the same name", () => {
		const codebase = new TestCodebase().file("node_modules/@types/node/index.d.ts", `declare var process: { env: Record<string, string | undefined> };`).file(
			"src/ordering/domain/services/pricing.service.ts",
			`export const rate = process.env.RATE;
				export const load = (url: string): Promise<Response> => fetch(url);
				export function local(console: { log(value: string): void }) { console.log("shadowed"); }`,
		);

		expect(codebase.messages(new NoImpureDomainRule())).toEqual([
			"The domain uses process, a global of the host: reach it through a port.",
			"The domain uses Response, a global of the host: reach it through a port.",
			"The domain uses fetch, a global of the host: reach it through a port.",
		]);
	});

	it("rejects the system clock and randomness", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/services/pricing.service.ts",
			`export const now = [Date.now(), new Date(), new Date, Date()];
			export const draw = Math.random();`,
		);

		expect(codebase.messages(new NoImpureDomainRule())).toEqual([
			"The domain reads the system clock with Date.now: receive the time from the Clock port.",
			"The domain reads the system clock with new Date(): receive the time from the Clock port.",
			"The domain reads the system clock with new Date(): receive the time from the Clock port.",
			"The domain reads the system clock with Date(): receive the time from the Clock port.",
			"The domain draws a random value with Math.random: receive it from a port, such as IdGenerator.",
		]);
	});

	it("reads a global declared by the project as an import of the file that declares it", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/driven/db/global-db.ts", `declare global { var db: { query(sql: string): void }; }\nexport {};`)
			.file("src/ordering/domain/services/global-rate.ts", `declare global { var rate: number; }\nexport {};`)
			.file("src/ordering/domain/services/pricing.service.ts", `export const run = () => globalThis.db.query(String(rate));`);

		expect(codebase.messages(new NoImpureDomainRule())).toEqual(["The domain imports src/ordering/driven/db/global-db.ts (ordering driven): it may only import the domain."]);
	});
});
