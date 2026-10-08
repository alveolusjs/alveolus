import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../../test/support/test-codebase.ts";
import { NoThrownFailureRule } from "./no-thrown-failure.rule.ts";

describe("NoThrownFailureRule", () => {
	it("accepts getters, and methods or function properties returning a Result, even inferred or awaited", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/aggregates/order.aggregate.ts",
			`import { AggregateRoot, DomainError, Identifier, err, ok, type Result } from "@alveolus/core";
			class OrderId extends Identifier<string, "OrderId"> {}
			class InvalidTotal extends DomainError {}
			export class Order extends AggregateRoot<OrderId> {
				private total = 0;
				get placedTotal(): number { return this.total; }
				place(total: number): Result<void, InvalidTotal> { return total > 0 ? ok() : err(new InvalidTotal()); }
				confirm() { return ok(); }
				async pay(): Promise<Result<void, never>> { return ok(); }
				public ship = (): Result<void, never> => ok();
				static create(id: OrderId): Order { return new Order(id); }
				toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.check(new NoThrownFailureRule())).toEqual([]);
	});

	it("rejects other public methods and thrown domain errors", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/aggregates/order.aggregate.ts",
			`import { AggregateRoot, DomainError, Identifier } from "@alveolus/core";
			class OrderId extends Identifier<string, "OrderId"> {}
			class InvalidTotal extends DomainError {}
			export class Order extends AggregateRoot<OrderId> {
				cancel(): void {
					throw new InvalidTotal();
				}
				canShip(): boolean { return true; }
				toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.check(new NoThrownFailureRule())).toEqual([
			"src/ordering/domain/aggregates/order.aggregate.ts:5 Order.cancel",
			"src/ordering/domain/aggregates/order.aggregate.ts:8 Order.canShip",
			"src/ordering/domain/aggregates/order.aggregate.ts:6 throw",
		]);
	});

	it("rejects function properties without a Result and setters", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/domain/aggregates/order.aggregate.ts",
			`import { AggregateRoot, Identifier } from "@alveolus/core";
			class OrderId extends Identifier<string, "OrderId"> {}
			export class Order extends AggregateRoot<OrderId> {
				private placed = false;
				public place = (): void => { this.placed = true; };
				set status(value: string) { this.placed = value === "placed"; }
				private readonly log = (): void => {};
				toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.messages(new NoThrownFailureRule())).toEqual([
			"Order.place must return a Result: expose reads as getters and return business failures as values.",
			"Order.status is a setter: change the state through a business method that returns a Result.",
		]);
	});

	it("rejects every failure thrown or rejected in the domain and the application, whatever its type", () => {
		const codebase = new TestCodebase()
			.file(
				"src/ordering/domain/services/pricing.service.ts",
				`import { DomainService } from "@alveolus/core";
				export class Pricing extends DomainService {
					price(total: number): number { if (total < 0) { throw new Error("negative"); } return total; }
					round(failure: unknown): never { throw failure; }
				}`,
			)
			.file(
				"src/ordering/application/commands/place-order.command.ts",
				`import { CommandHandler, type Result } from "@alveolus/core";
				export class PlaceOrder extends CommandHandler<void> {
					async handle(): Promise<Result<void, never>> { return Promise.reject(new Error("not found")); }
				}`,
			)
			.file("src/ordering/driven/adapters/pg-orders.adapter.ts", `export function connect(): never { throw new Error("connection lost"); }`);

		expect(codebase.check(new NoThrownFailureRule())).toEqual([
			"src/ordering/domain/services/pricing.service.ts:3 throw",
			"src/ordering/domain/services/pricing.service.ts:4 throw",
			"src/ordering/application/commands/place-order.command.ts:3 Promise.reject",
		]);
	});
});
