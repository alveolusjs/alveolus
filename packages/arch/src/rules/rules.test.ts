import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../test/support/test-codebase.ts";

/** A small project that follows every rule: ordering reads prices from the catalog through its open host service. */
function shop(codebase: TestCodebase = new TestCodebase()): TestCodebase {
	return codebase
		.file("src/ordering/domain/value-objects/order-id.identifier.ts", `import { Identifier } from "@alveolus/core";\nexport class OrderId extends Identifier<string, "OrderId"> {}`)
		.file("src/ordering/domain/value-objects/customer-id.identifier.ts", `import { Identifier } from "@alveolus/core";\nexport class CustomerId extends Identifier<string, "CustomerId"> {}`)
		.file("src/ordering/domain/errors/empty-order.error.ts", `import { DomainError } from "@alveolus/core";\nexport class EmptyOrder extends DomainError {}`)
		.file(
			"src/ordering/domain/aggregates/order.aggregate.ts",
			`import { AggregateRoot, err, ok, type Result } from "@alveolus/core";
import { EmptyOrder } from "../errors/empty-order.error.ts";
import type { CustomerId } from "../value-objects/customer-id.identifier.ts";
import type { OrderId } from "../value-objects/order-id.identifier.ts";
export class Order extends AggregateRoot<OrderId> {
	private placedAt: Date | undefined;
	public constructor(id: OrderId, private readonly customerId: CustomerId, private readonly lines: number) { super(id); }
	public place(at: Date): Result<void, EmptyOrder> {
		if (this.lines === 0) { return err(new EmptyOrder()); }
		this.placedAt = at;
		return ok(undefined);
	}
	public toSnapshot() { return { customerId: this.customerId.value, id: this.id.value, placedAt: this.placedAt ?? null }; }
}`,
		)
		.file("src/ordering/domain/views/order-summary.view.ts", `import type { View } from "@alveolus/core";\nexport type OrderSummary = View<{ id: string; total: number }>;`)
		.file(
			"src/ordering/domain/repositories/orders.repository.ts",
			`import { CommandRepository } from "@alveolus/core";\nimport type { Order } from "../aggregates/order.aggregate.ts";\nexport abstract class Orders extends CommandRepository<Order> {}`,
		)
		.file(
			"src/ordering/domain/repositories/order-summaries.repository.ts",
			`import { QueryRepository } from "@alveolus/core";
import type { OrderSummary } from "../views/order-summary.view.ts";
export abstract class OrderSummaries extends QueryRepository<OrderSummary> { public abstract byId(id: string): Promise<OrderSummary | undefined>; }`,
		)
		.file(
			"src/ordering/domain/ports/price-list.port.ts",
			`import { Port } from "@alveolus/core";\nexport abstract class PriceList extends Port { public abstract priceOf(productId: string): Promise<number>; }`,
		)
		.file(
			"src/ordering/application/commands/place-order.command.ts",
			`import { CommandHandler, type Clock, err, ok, type Result } from "@alveolus/core";
import type { EmptyOrder } from "../../domain/errors/empty-order.error.ts";
import { OrderId } from "../../domain/value-objects/order-id.identifier.ts";
import type { Orders } from "../../domain/repositories/orders.repository.ts";
export interface PlaceOrder { readonly orderId: string }
export class PlaceOrderHandler extends CommandHandler<PlaceOrder, void, EmptyOrder> {
	public constructor(private readonly orders: Orders, private readonly clock: Clock) { super(); }
	public async handle(command: PlaceOrder): Promise<Result<void, EmptyOrder>> {
		const order = await this.orders.findById(new OrderId(command.orderId));
		if (order === undefined) { return ok(undefined); }
		const placed = order.place(this.clock.now());
		if (!placed.ok) { return err(placed.error); }
		await this.orders.save(order);
		return ok(undefined);
	}
}`,
		)
		.file(
			"src/ordering/application/queries/get-order-summary.query.ts",
			`import { QueryHandler, ok, type Result } from "@alveolus/core";
import type { OrderSummary } from "../../domain/views/order-summary.view.ts";
import type { OrderSummaries } from "../../domain/repositories/order-summaries.repository.ts";
export class GetOrderSummaryHandler extends QueryHandler<string, OrderSummary | undefined> {
	public constructor(private readonly summaries: OrderSummaries) { super(); }
	public async handle(id: string): Promise<Result<OrderSummary | undefined, never>> { return ok(await this.summaries.byId(id)); }
}`,
		)
		.file(
			"src/ordering/driven/catalog/adapters/catalog-price-list.adapter.ts",
			`import type { AntiCorruptionLayer } from "@alveolus/core";
import type { CatalogApi } from "../../../../catalog/driving/in-process/catalog-api.ts";
import { PriceList } from "../../../domain/ports/price-list.port.ts";
export class CatalogPriceList extends PriceList implements AntiCorruptionLayer {
	public constructor(private readonly catalog: CatalogApi) { super(); }
	public async priceOf(productId: string): Promise<number> { return (await this.catalog.productById(productId))?.price ?? 0; }
}`,
		)
		.file("src/ordering/ordering.module.ts", `export class OrderingModule {}`)
		.file(
			"src/catalog/published-language/product.representation.ts",
			`import type { PublishedLanguage } from "@alveolus/core";\nexport type ProductRepresentation = PublishedLanguage<{ id: string; price: number }>;`,
		)
		.file(
			"src/catalog/driving/in-process/catalog-api.ts",
			`import type { OpenHostService } from "@alveolus/core";
import type { ProductRepresentation } from "../../published-language/product.representation.ts";
export class CatalogApi implements OpenHostService {
	public productById(id: string): Promise<ProductRepresentation | undefined> { return Promise.resolve({ id, price: 42 }); }
}`,
		)
		.file("src/catalog/catalog.module.ts", `export class CatalogModule {}`)
		.file(
			"src/app.module.ts",
			`import { CatalogModule } from "./catalog/catalog.module.ts";\nimport { OrderingModule } from "./ordering/ordering.module.ts";\nexport const modules = [CatalogModule, OrderingModule];`,
		);
}

describe("Rules", () => {
	it("leave a project that follows every rule without violation", () => {
		expect(shop().checkAllRules()).toEqual([]);
	});

	/**
	 * What static analysis cannot see, as documented in the Limits section of each rule.
	 * Each test passes while the limit holds: when a rule starts catching it, update the documentation and drop the test.
	 */
	describe("known limits", () => {
		it("do not see a plain port whose adapter reads the views", () => {
			const codebase = shop()
				.file(
					"src/ordering/domain/ports/order-stats.port.ts",
					`import { Port } from "@alveolus/core";\nexport abstract class OrderStats extends Port { public abstract countFor(customerId: string): Promise<number>; }`,
				)
				.file(
					"src/ordering/application/commands/place-order.command.ts",
					`import { CommandHandler, ok, type Result } from "@alveolus/core";
import type { OrderStats } from "../../domain/ports/order-stats.port.ts";
export class PlaceOrderHandler extends CommandHandler<string> {
	public constructor(private readonly stats: OrderStats) { super(); }
	public async handle(customerId: string): Promise<Result<void, never>> { await this.stats.countFor(customerId); return ok(undefined); }
}`,
				);

			expect(codebase.checkAllRules()).toEqual([]);
		});

		it("do not see an interface with the shape of another aggregate", () => {
			const codebase = shop()
				.file("src/ordering/domain/views/customer-like.view.ts", `export interface CustomerLike { readonly name: string; rename(name: string): void }`)
				.file(
					"src/ordering/domain/aggregates/order.aggregate.ts",
					`import { AggregateRoot } from "@alveolus/core";
import type { CustomerLike } from "../views/customer-like.view.ts";
import type { OrderId } from "../value-objects/order-id.identifier.ts";
export class Order extends AggregateRoot<OrderId> {
	public constructor(id: OrderId, private readonly customer: CustomerLike) { super(id); }
	public toSnapshot() { return { id: this.id.value }; }
}`,
				);

			expect(codebase.checkAllRules()).toEqual([]);
		});

		it("leave adapters free under their technology", () => {
			const codebase = shop().file(
				"src/ordering/driven/pg/helpers/sql.ts",
				`import { Pool } from "pg";\nexport const pool = new Pool();\nexport function run(sql: string) { return pool.query(sql); }`,
			);

			expect(codebase.checkAllRules()).toEqual([]);
		});

		it("do not read the methods of the module class", () => {
			const codebase = shop().file("src/ordering/ordering.module.ts", `export class OrderingModule { public discount(total: number): number { return total > 100 ? 0.1 : 0; } }`);

			expect(codebase.checkAllRules()).toEqual([]);
		});

		it("do not see a promise rejected from its executor", () => {
			const codebase = shop().file(
				"src/ordering/domain/services/pricing.service.ts",
				`import { DomainService } from "@alveolus/core";\nexport class Pricing extends DomainService { public later(): Promise<number> { return new Promise((_, reject) => reject(new Error("no price"))); } }`,
			);

			expect(codebase.checkAllRules()).toEqual([]);
		});

		it("skip the files that the configuration ignores", () => {
			const codebase = shop(new TestCodebase({ ignore: ["src/ordering/domain/legacy/**"] })).file(
				"src/ordering/domain/legacy/pg-order.ts",
				`import { Pool } from "pg";\nexport const pool = new Pool();`,
			);

			expect(codebase.checkAllRules()).toEqual([]);
		});
	});
});
