import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../../test/support/test-codebase.ts";
import { NoCommandInQueryRule } from "./no-command-in-query.rule.ts";

const ports = `import { AggregateRoot, CommandRepository, Identifier, QueryRepository, type View } from "@alveolus/core";
class OrderId extends Identifier<string, "OrderId"> {}
class Order extends AggregateRoot<OrderId> { toSnapshot() { return { id: this.id.value }; } }
export abstract class Orders extends CommandRepository<Order> {}
export abstract class OrderSummaries extends QueryRepository<View<{ id: string }>> {}`;

describe("NoCommandInQueryRule", () => {
	it("accepts a query handler receiving a query repository", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/repositories/ports.ts", ports).file(
			"src/ordering/application/handlers.ts",
			`import { QueryHandler, ok, type Result } from "@alveolus/core";
			import type { OrderSummaries } from "../domain/repositories/ports.ts";
			export class GetOrder extends QueryHandler<void, void> {
				constructor(private readonly summaries: OrderSummaries) { super(); }
				async handle(): Promise<Result<void, never>> { return ok(); }
			}`,
		);

		expect(codebase.check(new NoCommandInQueryRule())).toEqual([]);
	});

	it("rejects a query handler receiving what writes", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/repositories/ports.ts", ports).file(
			"src/ordering/application/handlers.ts",
			`import { QueryHandler, UnitOfWork, ok, type Result } from "@alveolus/core";
			import type { Orders } from "../domain/repositories/ports.ts";
			export class GetOrder extends QueryHandler<void, void> {
				constructor(private readonly orders: Orders, private readonly unitOfWork: UnitOfWork) { super(); }
				async handle(): Promise<Result<void, never>> { return ok(); }
			}`,
		);

		expect(codebase.check(new NoCommandInQueryRule())).toEqual(["src/ordering/application/handlers.ts:4 GetOrder.orders", "src/ordering/application/handlers.ts:4 GetOrder.unitOfWork"]);
	});
});
