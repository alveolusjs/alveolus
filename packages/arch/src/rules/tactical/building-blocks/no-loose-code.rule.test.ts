import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../test/support/test-codebase.ts";
import { NoLooseCodeRule } from "./no-loose-code.rule.ts";

describe("NoLooseCodeRule", () => {
	it("accepts building blocks, types and constants of data", () => {
		const codebase = new TestCodebase()
			.file(
				"src/ordering/domain/value-objects/money.value-object.ts",
				`import { ValueObject } from "@alveolus/core";
				export const maxAmount = 1_000_000;
				export const statuses = ["placed", "paid"] as const;
				export const limits = { daily: maxAmount / 10, label: \`max \${maxAmount}\`, statuses: [...statuses] } satisfies object;
				export type Currency = "EUR" | "USD";
				declare global { interface OrderingFlags { readonly strict: boolean } }
				export abstract class Amount extends ValueObject<{ value: number }> {}
				export class Money extends Amount {
					static of(value: number): Money { return new Money({ value }); }
					double(): Money { return Money.of(this.props.value * 2); }
				}`,
			)
			.file(
				"src/ordering/application/commands/place-order.command.ts",
				`import { CommandHandler, ok, type Result } from "@alveolus/core";
				export interface PlaceOrder { readonly orderId: string }
				export class PlaceOrderHandler extends CommandHandler<PlaceOrder> {
					async handle(): Promise<Result<void, never>> { return [1, 2].map((value) => value) && ok(); }
				}`,
			);

		expect(codebase.check(new NoLooseCodeRule())).toEqual([]);
	});

	it("rejects plain classes, technical errors, free functions and enums in the domain and the application", () => {
		const codebase = new TestCodebase()
			.file(
				"src/ordering/domain/services/pricing.ts",
				`export class Pricing {}
				export class InvariantBroken extends Error {}
				export function round(value: number): number { return Math.round(value); }
				export const half = (value: number): number => value / 2;
				export enum Status { Draft, Placed }`,
			)
			.file("src/ordering/application/mappers/order.mapper.ts", `export class OrderMapper {}`);

		expect(codebase.check(new NoLooseCodeRule())).toEqual([
			"src/ordering/domain/services/pricing.ts:1 Pricing",
			"src/ordering/domain/services/pricing.ts:2 InvariantBroken",
			"src/ordering/domain/services/pricing.ts:3 round",
			"src/ordering/domain/services/pricing.ts:4 half",
			"src/ordering/domain/services/pricing.ts:5 Status",
			"src/ordering/application/mappers/order.mapper.ts:1 OrderMapper",
		]);
	});

	it("leaves plain classes in adapters, the composition root and the root of src alone", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/driving/http/orders.controller.ts", `export class OrdersController {}\nexport const routes = ["orders"];`)
			.file("src/ordering/driven/pg/mappers/order.mapper.ts", `export class OrderMapper {}`)
			.file("src/ordering/ordering.module.ts", `export class OrderingModule {}`)
			.file("src/main.ts", `export function bootstrap(): void {}\nbootstrap();`);

		expect(codebase.check(new NoLooseCodeRule())).toEqual([]);
	});

	it("rejects loose code in an adapter layer", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/driven/pg/helpers/sql.ts",
			`export const pool = { query(sql: string) { return sql; } };
			export function run(sql: string) { return pool.query(sql); }
			pool.query("select 1");`,
		);

		expect(codebase.messages(new NoLooseCodeRule())).toEqual([
			"The computed constant pool has no place in an adapter layer: adapters are classes; make it a method of the adapter, or a mapper class of its own.",
			"The function run has no place in an adapter layer: adapters are classes; make it a method of the adapter, or a mapper class of its own.",
			"A statement runs when the module loads: an adapter layer holds classes, which the composition root wires.",
		]);
	});

	it("rejects namespaces, objects of functions, computed constants, class expressions, module state and statements", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/services/pricing.ts",
			`import { DomainService } from "@alveolus/core";
			export namespace Rates { export const vat = 0.2; }
			export const Pricing = { total(prices: number[]) { return prices.length; } };
			export const total = Math.max(1, 2);
			export const count = ((prices: number[]) => prices.length) as (prices: number[]) => number;
			export const Helper = class extends DomainService {};
			export let calls = 0;
			calls++;
			export const alias = Math.max;`,
		);

		expect(codebase.messages(new NoLooseCodeRule())).toEqual([
			"The namespace Rates groups loose code: make it a method of a value object or of a DomainService.",
			"The constant Pricing is computed when the module loads: keep top-level constants to plain data.",
			"The constant total is computed when the module loads: keep top-level constants to plain data.",
			"The function count floats outside any class: make it a method of a value object or of a DomainService.",
			"Helper is a class expression: declare it as a class that extends a building block.",
			"calls is module state: keep state in aggregates, not in modules.",
			"A statement runs when the module loads: move it into a method.",
			"The function alias floats outside any class: make it a method of a value object or of a DomainService.",
		]);
	});

	it("rejects a building block that only has static members", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/value-objects/utils.value-object.ts",
			`import { ValueObject } from "@alveolus/core";
			export class Utils extends ValueObject<object> {
				private constructor() { super({}); }
				static total(prices: number[]): number { return prices.length; }
			}
			export class Empty extends ValueObject<object> {}`,
		);

		expect(codebase.messages(new NoLooseCodeRule())).toEqual([
			"Utils only has static members: a class of functions is no building block; make them methods of the value object they work on, or of a DomainService.",
		]);
	});

	it("rejects a class that extends an expression: a mixin, a cast, a constant", () => {
		const codebase = new TestCodebase()
			.file(
				"src/ordering/domain/repositories/order-summaries.repository.ts",
				`import { Port, QueryRepository } from "@alveolus/core";
				const Base = QueryRepository as unknown as abstract new () => Port;
				export abstract class OrderSummaries extends Base {}`,
			)
			.file(
				"src/ordering/domain/aggregates/order.aggregate.ts",
				`import { AggregateRoot } from "@alveolus/core";
				function Auditable<T extends abstract new (...args: any[]) => object>(base: T) { return base; }
				export abstract class Order extends Auditable(AggregateRoot)<never> {}`,
			)
			.file(
				"src/ordering/domain/aggregates/invoice.aggregate.ts",
				`import * as core from "@alveolus/core";
				export abstract class Invoice extends core.AggregateRoot<never> {}`,
			);

		expect(
			codebase
				.messages(new NoLooseCodeRule())
				.filter((message) => message.includes("extends an expression"))
				.sort(),
		).toEqual([
			"Order extends an expression: extend a class by its name, so that what it is stays readable.",
			"OrderSummaries extends an expression: extend a class by its name, so that what it is stays readable.",
		]);
	});

	it("keeps the composition root to its module class", () => {
		const codebase = new TestCodebase()
			.file(
				"src/ordering/ordering.module.ts",
				`export const providers = ["orders"];
				export function buildPricing(): number { return 0.1; }
				export class OrderingModule { pricing(): number { return buildPricing(); } }`,
			)
			.file("src/main.ts", `import { OrderingModule } from "./ordering/ordering.module.ts";\nnew OrderingModule();`);

		expect(codebase.messages(new NoLooseCodeRule())).toEqual(["The function buildPricing has no place in a composition root: it holds its module class only."]);
	});
});
