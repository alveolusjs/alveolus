import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../../test/support/test-codebase.ts";
import { NoForeignQueryDependencyRule } from "./no-foreign-query-dependency.rule.ts";

const blocks = `import { AggregateRoot, CommandHandler, CommandRepository, DomainService, EventTranslator, Identifier, QueryRepository, ValueObject, type View } from "@alveolus/core";
class OrderId extends Identifier<string, "OrderId"> {}
class Order extends AggregateRoot<OrderId> { toSnapshot() { return { id: this.id.value }; } }
export abstract class Orders extends CommandRepository<Order> {}
export abstract class OrderSummaries extends QueryRepository<View<{ id: string }>> {}
export class OrderLimit extends DomainService {}
export abstract class OrderEvents extends EventTranslator<never> {}
export class Money extends ValueObject<{ amount: number }> {}
export abstract class PlaceOrder extends CommandHandler<void> {}`;

function handler(members: string): TestCodebase {
	return new TestCodebase().file("src/ordering/domain/blocks.ts", blocks).file(
		"src/ordering/application/queries/get-order.query.ts",
		`import { QueryHandler, type Clock, type UnitOfWork, ok, type Result } from "@alveolus/core";
		import type { Money, OrderEvents, OrderLimit, OrderSummaries, Orders, PlaceOrder } from "../../domain/blocks.ts";
		export class GetOrder extends QueryHandler<void, void> {
			${members}
			async handle(): Promise<Result<void, never>> { return ok(); }
		}`,
	);
}

describe("NoForeignQueryDependencyRule", () => {
	it("accepts query repositories, ports that do not write, value objects and plain values", () => {
		const codebase = handler(`constructor(private readonly summaries: OrderSummaries, private readonly clock: Clock, private readonly minimum: Money, private readonly page: number) { super(); }`);

		expect(codebase.check(new NoForeignQueryDependencyRule())).toEqual([]);
	});

	it("rejects what writes or changes state, in the constructor or in a field", () => {
		const codebase = handler(
			`declare private readonly events: OrderEvents;
			constructor(private readonly orders: Orders, private readonly unitOfWork: UnitOfWork, private readonly placeOrder: PlaceOrder, private readonly limit: OrderLimit) { super(); }`,
		);

		expect(codebase.check(new NoForeignQueryDependencyRule())).toEqual([
			"src/ordering/application/queries/get-order.query.ts:4 GetOrder.events",
			"src/ordering/application/queries/get-order.query.ts:5 GetOrder.orders",
			"src/ordering/application/queries/get-order.query.ts:5 GetOrder.unitOfWork",
			"src/ordering/application/queries/get-order.query.ts:5 GetOrder.placeOrder",
			"src/ordering/application/queries/get-order.query.ts:5 GetOrder.limit",
		]);
		expect(codebase.messages(new NoForeignQueryDependencyRule())[2]).toBe(
			"The QueryHandler GetOrder receives UnitOfWork, a UnitOfWork: a query handler receives query repositories, ports that do not write, and value objects.",
		);
	});

	it("rejects what writes behind Pick or inside an object of dependencies", () => {
		const codebase = handler(`constructor(private readonly slice: Pick<Orders, "findById">, private readonly deps: { unitOfWork: UnitOfWork }) { super(); }`);

		expect(codebase.check(new NoForeignQueryDependencyRule())).toEqual([
			"src/ordering/application/queries/get-order.query.ts:4 GetOrder.slice",
			"src/ordering/application/queries/get-order.query.ts:4 GetOrder.deps",
		]);
	});
});
