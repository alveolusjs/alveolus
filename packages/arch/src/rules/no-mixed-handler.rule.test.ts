import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";
import { NoMixedHandlerRule } from "./no-mixed-handler.rule.ts";

const ports = `import { AggregateRoot, CommandRepository, Identifier, QueryRepository, type View } from "@alveolus/core";
class OrderId extends Identifier<string, "OrderId"> {}
class Order extends AggregateRoot<OrderId> { toSnapshot() { return { id: this.id.value }; } }
export abstract class Orders extends CommandRepository<Order> {}
export abstract class OrderSummaries extends QueryRepository<View<{ id: string }>> {}`;

describe("NoMixedHandlerRule", () => {
	it("accepts handlers that stay on their side", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/repositories/ports.ts", ports).file(
			"src/ordering/application/handlers.ts",
			`import { CommandHandler, QueryHandler, ok, type Result } from "@alveolus/core";
			import type { OrderSummaries, Orders } from "../domain/repositories/ports.ts";
			export class PlaceOrder extends CommandHandler<void> {
				constructor(private readonly orders: Orders) { super(); }
				async handle(): Promise<Result<void, never>> { return ok(); }
			}
			export class GetOrder extends QueryHandler<void, void> {
				constructor(private readonly summaries: OrderSummaries) { super(); }
				async handle(): Promise<Result<void, never>> { return ok(); }
			}`,
		);

		expect(codebase.check(new NoMixedHandlerRule())).toEqual([]);
	});

	it("rejects a command handler reading a query repository and a query handler writing", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/repositories/ports.ts", ports).file(
			"src/ordering/application/handlers.ts",
			`import { CommandHandler, QueryHandler, UnitOfWork, ok, type Result } from "@alveolus/core";
			import type { OrderSummaries, Orders } from "../domain/repositories/ports.ts";
			export class PlaceOrder extends CommandHandler<void> {
				constructor(private readonly summaries: OrderSummaries) { super(); }
				async handle(): Promise<Result<void, never>> { return ok(); }
			}
			export class GetOrder extends QueryHandler<void, void> {
				constructor(private readonly orders: Orders, private readonly unitOfWork: UnitOfWork) { super(); }
				async handle(): Promise<Result<void, never>> { return ok(); }
			}`,
		);

		expect(codebase.check(new NoMixedHandlerRule())).toEqual([
			"src/ordering/application/handlers.ts:4 PlaceOrder.summaries",
			"src/ordering/application/handlers.ts:8 GetOrder.orders",
			"src/ordering/application/handlers.ts:8 GetOrder.unitOfWork",
		]);
	});
});
