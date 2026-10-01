import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";
import { ErrorsAsValuesRule } from "./errors-as-values.rule.ts";

describe("ErrorsAsValuesRule", () => {
	it("accepts getters and methods returning a Result, even when inferred", () => {
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
				static create(id: OrderId): Order { return new Order(id); }
				toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.check(new ErrorsAsValuesRule())).toEqual([]);
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

		expect(codebase.check(new ErrorsAsValuesRule())).toEqual([
			"src/ordering/domain/aggregates/order.aggregate.ts:5 Order.cancel",
			"src/ordering/domain/aggregates/order.aggregate.ts:8 Order.canShip",
			"src/ordering/domain/aggregates/order.aggregate.ts:6 throw",
		]);
	});
});
