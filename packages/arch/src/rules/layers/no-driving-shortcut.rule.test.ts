import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import { NoDrivingShortcutRule } from "./no-driving-shortcut.rule.ts";

function ordering(controller: string): TestCodebase {
	return new TestCodebase()
		.file("src/ordering/domain/value-objects/order-id.identifier.ts", `import { Identifier } from "@alveolus/core";\nexport class OrderId extends Identifier<string, "OrderId"> {}`)
		.file("src/ordering/domain/errors/empty-order.error.ts", `import { DomainError } from "@alveolus/core";\nexport class EmptyOrder extends DomainError {}`)
		.file(
			"src/ordering/domain/aggregates/order.aggregate.ts",
			`import { AggregateRoot } from "@alveolus/core";\nimport type { OrderId } from "../value-objects/order-id.identifier.ts";\nexport class Order extends AggregateRoot<OrderId> { toSnapshot() { return { id: this.id.value }; } }`,
		)
		.file(
			"src/ordering/domain/repositories/orders.repository.ts",
			`import { CommandRepository } from "@alveolus/core";\nimport type { Order } from "../aggregates/order.aggregate.ts";\nexport abstract class Orders extends CommandRepository<Order> {}`,
		)
		.file("src/ordering/domain/ports/payments.port.ts", `import { Port } from "@alveolus/core";\nexport abstract class Payments extends Port {}`)
		.file(
			"src/ordering/application/commands/place-order.command.ts",
			`import { CommandHandler, ok, type Result } from "@alveolus/core";\nexport class PlaceOrderHandler extends CommandHandler<void> { async handle(): Promise<Result<void, never>> { return ok(undefined); } }`,
		)
		.file("src/ordering/driving/http/orders.controller.ts", controller);
}

describe("NoDrivingShortcutRule", () => {
	it("lets a driving adapter call the handlers and map with the types of the domain", () => {
		const codebase = ordering(
			`import type { PlaceOrderHandler } from "../../application/commands/place-order.command.ts";
			import { EmptyOrder } from "../../domain/errors/empty-order.error.ts";
			import { OrderId } from "../../domain/value-objects/order-id.identifier.ts";
			export class OrdersController { constructor(private readonly placeOrder: PlaceOrderHandler) {} }`,
		);

		expect(codebase.check(new NoDrivingShortcutRule())).toEqual([]);
	});

	it("rejects a driving adapter reaching a repository, a port or an aggregate", () => {
		const codebase = ordering(
			`import type { Order } from "../../domain/aggregates/order.aggregate.ts";
			import type { Payments } from "../../domain/ports/payments.port.ts";
			import * as repositories from "../../domain/repositories/orders.repository.ts";
			export class OrdersController { constructor(private readonly orders: repositories.Orders, private readonly payments: Payments) {} }`,
		);

		expect(codebase.messages(new NoDrivingShortcutRule())).toEqual([
			"Imports Order, an AggregateRoot: a driving adapter calls the command and query handlers, never the ports, repositories or aggregates of the domain.",
			"Imports Payments, a Port: a driving adapter calls the command and query handlers, never the ports, repositories or aggregates of the domain.",
			"Imports Orders, a CommandRepository: a driving adapter calls the command and query handlers, never the ports, repositories or aggregates of the domain.",
		]);
	});
});
