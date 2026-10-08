import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../../test/support/test-codebase.ts";
import { NoStatefulServiceRule } from "./no-stateful-service.rule.ts";

const blocks = `import { AggregateRoot, CommandRepository, DomainService, Identifier, ValueObject } from "@alveolus/core";
export class OrderId extends Identifier<string, "OrderId"> {}
class Order extends AggregateRoot<OrderId> { toSnapshot() { return { id: this.id.value }; } }
export abstract class Orders extends CommandRepository<Order> {}
export class Money extends ValueObject<{ amount: number }> {}
export class Pricing extends DomainService {}`;

function service(members: string): TestCodebase {
	return new TestCodebase().file("src/ordering/domain/blocks.ts", blocks).file(
		"src/ordering/domain/services/order-limit.service.ts",
		`import { DomainService, type Clock } from "@alveolus/core";
		import type { Money, OrderId, Orders, Pricing } from "../blocks.ts";
		export class OrderLimit extends DomainService {
			${members}
		}`,
	);
}

describe("NoStatefulServiceRule", () => {
	it("accepts configuration: plain values, value objects and identifiers", () => {
		const codebase = service(`constructor(private readonly maxLines: number, private readonly ceiling: Money, private readonly vip: OrderId) { super(); }`);

		expect(codebase.check(new NoStatefulServiceRule())).toEqual([]);
	});

	it("rejects a repository, a port and another service", () => {
		const codebase = service(`constructor(private readonly orders: Orders, private readonly clock: Clock, private readonly pricing: Pricing) { super(); }`);

		expect(codebase.messages(new NoStatefulServiceRule())).toEqual([
			"The DomainService OrderLimit holds Orders, a CommandRepository: a domain service holds configuration only; the command handler passes it what it needs.",
			"The DomainService OrderLimit holds Clock, a Port: a domain service holds configuration only; the command handler passes it what it needs.",
			"The DomainService OrderLimit holds Pricing, a DomainService: a domain service holds configuration only; the command handler passes it what it needs.",
		]);
	});
});
