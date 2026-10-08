import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../../test/support/test-codebase.ts";
import { NoQueryInCommandRule } from "./no-query-in-command.rule.ts";

const ports = `import { AggregateRoot, CommandRepository, Identifier, QueryRepository, type View } from "@alveolus/core";
class OrderId extends Identifier<string, "OrderId"> {}
class Order extends AggregateRoot<OrderId> { toSnapshot() { return { id: this.id.value }; } }
export abstract class Orders extends CommandRepository<Order> {}
export abstract class OrderSummaries extends QueryRepository<View<{ id: string }>> {}`;

describe("NoQueryInCommandRule", () => {
	it("accepts a command handler receiving a command repository", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/repositories/ports.ts", ports).file(
			"src/ordering/application/handlers.ts",
			`import { CommandHandler, ok, type Result } from "@alveolus/core";
			import type { Orders } from "../domain/repositories/ports.ts";
			export class PlaceOrder extends CommandHandler<void> {
				constructor(private readonly orders: Orders) { super(); }
				async handle(): Promise<Result<void, never>> { return ok(); }
			}`,
		);

		expect(codebase.check(new NoQueryInCommandRule())).toEqual([]);
	});

	it("rejects a command handler receiving a query repository", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/repositories/ports.ts", ports).file(
			"src/ordering/application/handlers.ts",
			`import { CommandHandler, ok, type Result } from "@alveolus/core";
			import type { OrderSummaries } from "../domain/repositories/ports.ts";
			export class PlaceOrder extends CommandHandler<void> {
				constructor(private readonly summaries: OrderSummaries) { super(); }
				async handle(): Promise<Result<void, never>> { return ok(); }
			}`,
		);

		expect(codebase.check(new NoQueryInCommandRule())).toEqual(["src/ordering/application/handlers.ts:4 PlaceOrder.summaries"]);
	});
});
