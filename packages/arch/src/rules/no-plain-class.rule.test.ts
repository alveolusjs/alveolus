import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";
import { NoPlainClassRule } from "./no-plain-class.rule.ts";

describe("NoPlainClassRule", () => {
	it("accepts building blocks, types and constants of data", () => {
		const codebase = new TestCodebase()
			.file(
				"src/ordering/domain/value-objects/money.value-object.ts",
				`import { ValueObject } from "@alveolus/core";
				export const maxAmount = 1_000_000;
				export type Currency = "EUR" | "USD";
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

		expect(codebase.check(new NoPlainClassRule())).toEqual([]);
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

		expect(codebase.check(new NoPlainClassRule())).toEqual([
			"src/ordering/domain/services/pricing.ts:1 Pricing",
			"src/ordering/domain/services/pricing.ts:2 InvariantBroken",
			"src/ordering/domain/services/pricing.ts:3 round",
			"src/ordering/domain/services/pricing.ts:4 half",
			"src/ordering/domain/services/pricing.ts:5 Status",
			"src/ordering/application/mappers/order.mapper.ts:1 OrderMapper",
		]);
	});

	it("leaves adapters and composition roots alone", () => {
		const codebase = new TestCodebase()
			.file("src/ordering/driving/http/orders.controller.ts", `export class OrdersController {}\nexport function helper(): void {}`)
			.file("src/ordering/ordering.module.ts", `export class OrderingModule {}`);

		expect(codebase.check(new NoPlainClassRule())).toEqual([]);
	});
});
