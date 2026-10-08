import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../test/support/test-codebase.ts";
import { NoForeignCommandDependencyRule } from "./no-foreign-command-dependency.rule.ts";

const blocks = `import { AggregateRoot, CommandHandler, CommandRepository, DomainService, EventTranslator, Identifier, QueryHandler, QueryRepository, ValueObject, type View } from "@alveolus/core";
class OrderId extends Identifier<string, "OrderId"> {}
class Order extends AggregateRoot<OrderId> { toSnapshot() { return { id: this.id.value }; } }
export abstract class Orders extends CommandRepository<Order> {}
export abstract class OrderSummaries extends QueryRepository<View<{ id: string }>> {}
export class OrderLimit extends DomainService {}
export abstract class OrderEvents extends EventTranslator<never> {}
export class Money extends ValueObject<{ amount: number }> {}
export abstract class GetOrder extends QueryHandler<void, void> {}
export abstract class PayOrder extends CommandHandler<void> {}
export class Helper {}`;

function handler(members: string): TestCodebase {
	return new TestCodebase().file("src/ordering/domain/blocks.ts", blocks).file(
		"src/ordering/application/commands/place-order.command.ts",
		`import { CommandHandler, type Clock, type EventPublisher, type Outbox, ok, type Result } from "@alveolus/core";
		import type { Decimal } from "decimal.js";
		import type { GetOrder, Helper, Money, OrderEvents, OrderLimit, OrderSummaries, Orders, PayOrder } from "../../domain/blocks.ts";
		export class PlaceOrder extends CommandHandler<void> {
			${members}
			async handle(): Promise<Result<void, never>> { return ok(); }
		}`,
	);
}

describe("NoForeignCommandDependencyRule", () => {
	it("accepts command repositories, ports, event translators, domain services, value objects and plain values", () => {
		const codebase = handler(
			`constructor(private readonly orders: Orders, private readonly clock: Clock, private readonly outbox: Outbox, private readonly events: OrderEvents, private readonly limit: OrderLimit, private readonly minimum: Money, private readonly retries: number) { super(); }`,
		);

		expect(codebase.check(new NoForeignCommandDependencyRule())).toEqual([]);
	});

	it("leaves the classes of a package to applicationDependencies", () => {
		const codebase = handler(`constructor(private readonly rate: Decimal) { super(); }`).file("node_modules/decimal.js/index.d.ts", `export declare class Decimal { constructor(value: string); }`);

		expect(codebase.check(new NoForeignCommandDependencyRule())).toEqual([]);
	});

	it("rejects a query repository, another handler and a plain class, in the constructor or in a field", () => {
		const codebase = handler(
			`declare private readonly helper: Helper;
			constructor(private readonly summaries: OrderSummaries, private readonly getOrder: GetOrder, private readonly payOrder: PayOrder) { super(); }`,
		);

		expect(codebase.messages(new NoForeignCommandDependencyRule())).toEqual([
			"The CommandHandler PlaceOrder receives Helper, a class that extends no building block: a command handler receives command repositories, ports, event translators, domain services and value objects; events leave through the outbox, never a publisher.",
			"The CommandHandler PlaceOrder receives OrderSummaries, a QueryRepository: a command handler receives command repositories, ports, event translators, domain services and value objects; events leave through the outbox, never a publisher.",
			"The CommandHandler PlaceOrder receives GetOrder, a QueryHandler: a command handler receives command repositories, ports, event translators, domain services and value objects; events leave through the outbox, never a publisher.",
			"The CommandHandler PlaceOrder receives PayOrder, a CommandHandler: a command handler receives command repositories, ports, event translators, domain services and value objects; events leave through the outbox, never a publisher.",
		]);
	});

	it("rejects a query repository behind Pick or inside an object of dependencies", () => {
		const codebase = handler(`constructor(private readonly slice: Pick<OrderSummaries, never>, private readonly deps: { summaries: OrderSummaries }) { super(); }`);

		expect(codebase.check(new NoForeignCommandDependencyRule())).toEqual([
			"src/ordering/application/commands/place-order.command.ts:5 PlaceOrder.slice",
			"src/ordering/application/commands/place-order.command.ts:5 PlaceOrder.deps",
		]);
	});

	it("rejects an event publisher: events leave through the outbox", () => {
		const codebase = handler(`constructor(private readonly publisher: EventPublisher) { super(); }`);

		expect(codebase.check(new NoForeignCommandDependencyRule())).toEqual(["src/ordering/application/commands/place-order.command.ts:5 PlaceOrder.publisher"]);
	});
});
