import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";
import { NoAggregateReferenceRule } from "./no-aggregate-reference.rule.ts";

const customer = `import { AggregateRoot, Identifier } from "@alveolus/core";
export class CustomerId extends Identifier<string, "CustomerId"> {}
export class Customer extends AggregateRoot<CustomerId> { toSnapshot() { return { id: this.id.value }; } }`;

describe("NoAggregateReferenceRule", () => {
	it("accepts a reference by identifier", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/aggregates/customer.aggregate.ts", customer).file(
			"src/ordering/domain/aggregates/order.aggregate.ts",
			`import { AggregateRoot, Identifier } from "@alveolus/core";
			import type { CustomerId } from "./customer.aggregate.ts";
			class OrderId extends Identifier<string, "OrderId"> {}
			export class Order extends AggregateRoot<OrderId> {
				private constructor(id: OrderId, private readonly customerId: CustomerId) { super(id); }
				toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.check(new NoAggregateReferenceRule())).toEqual([]);
	});

	it("rejects an aggregate held by another aggregate or by an entity, alone or in a collection", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/aggregates/customer.aggregate.ts", customer).file(
			"src/ordering/domain/entities/order-line.entity.ts",
			`import { Entity, Identifier } from "@alveolus/core";
			import type { Customer } from "../aggregates/customer.aggregate.ts";
			class LineId extends Identifier<string, "LineId"> {}
			export class OrderLine extends Entity<LineId> {
				private readonly buyers: readonly Customer[] = [];
				private constructor(id: LineId, private readonly customer: Customer | undefined) { super(id); }
				toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.check(new NoAggregateReferenceRule())).toEqual([
			"src/ordering/domain/entities/order-line.entity.ts:5 OrderLine.buyers",
			"src/ordering/domain/entities/order-line.entity.ts:6 OrderLine.customer",
		]);
	});
});
