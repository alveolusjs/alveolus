import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../../test/support/test-codebase.ts";
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

	it("follows the aggregate through generics, tuples, object types, Pick and lazy loading, but not callback parameters", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/aggregates/customer.aggregate.ts", customer).file(
			"src/ordering/domain/aggregates/order.aggregate.ts",
			`import { AggregateRoot, Identifier } from "@alveolus/core";
			import type { Customer } from "./customer.aggregate.ts";
			class OrderId extends Identifier<string, "OrderId"> {}
			class Lazy<T> { constructor(private readonly load: () => T) {} }
			export class Order extends AggregateRoot<OrderId> {
				private readonly byId: Record<string, Customer> = {};
				private readonly pair: [Customer, number] | undefined;
				private readonly ref: { readonly customer: Customer } | undefined;
				private readonly slice: Pick<Customer, "id"> | undefined;
				private readonly load: () => Promise<Customer>;
				private readonly lazy: Lazy<Customer> | undefined;
				private readonly onChange: (customer: Customer) => void;
				toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.check(new NoAggregateReferenceRule())).toEqual([
			"src/ordering/domain/aggregates/order.aggregate.ts:6 Order.byId",
			"src/ordering/domain/aggregates/order.aggregate.ts:7 Order.pair",
			"src/ordering/domain/aggregates/order.aggregate.ts:8 Order.ref",
			"src/ordering/domain/aggregates/order.aggregate.ts:9 Order.slice",
			"src/ordering/domain/aggregates/order.aggregate.ts:10 Order.load",
			"src/ordering/domain/aggregates/order.aggregate.ts:11 Order.lazy",
		]);
	});

	it("rejects an aggregate in the props of a value object or the payload of a domain event", () => {
		const codebase = new TestCodebase().file("src/ordering/domain/aggregates/customer.aggregate.ts", customer).file(
			"src/ordering/domain/value-objects/buyer.value-object.ts",
			`import { DomainEvent, Identifier, ValueObject } from "@alveolus/core";
			import type { Customer, CustomerId } from "../aggregates/customer.aggregate.ts";
			export class Buyer extends ValueObject<{ customer: Customer }> {}
			export class CustomerMoved extends DomainEvent<CustomerId, { customer: Customer }> {}`,
		);

		expect(codebase.messages(new NoAggregateReferenceRule())).toEqual([
			"Buyer holds the aggregate Customer in its Props: reference it by its identifier instead.",
			"CustomerMoved holds the aggregate Customer in its Payload: reference it by its identifier instead.",
		]);
	});

	it("lets an aggregate hold its own entities, directly or through its value objects", () => {
		const codebase = new TestCodebase()
			.file(
				"src/ordering/domain/entities/address.entity.ts",
				`import { Entity, Identifier } from "@alveolus/core";
				export class AddressId extends Identifier<string, "AddressId"> {}
				export class Address extends Entity<AddressId> { toSnapshot() { return { id: this.id.value }; } }`,
			)
			.file(
				"src/ordering/domain/value-objects/shipping.value-object.ts",
				`import { ValueObject } from "@alveolus/core";
				import type { Address } from "../entities/address.entity.ts";
				export class Shipping extends ValueObject<{ address: Address }> {}`,
			)
			.file(
				"src/ordering/domain/aggregates/order.aggregate.ts",
				`import { AggregateRoot, Identifier } from "@alveolus/core";
				import type { Address } from "../entities/address.entity.ts";
				import type { Shipping } from "../value-objects/shipping.value-object.ts";
				class OrderId extends Identifier<string, "OrderId"> {}
				export class Order extends AggregateRoot<OrderId> {
					private constructor(id: OrderId, private readonly billing: Address, private readonly shipping: Shipping) { super(id); }
					toSnapshot() { return { id: this.id.value }; }
				}`,
			);

		expect(codebase.check(new NoAggregateReferenceRule())).toEqual([]);
	});

	it("rejects an entity held by two aggregates, even through a value object", () => {
		const codebase = new TestCodebase()
			.file(
				"src/ordering/domain/entities/address.entity.ts",
				`import { Entity, Identifier } from "@alveolus/core";
				export class AddressId extends Identifier<string, "AddressId"> {}
				export class Address extends Entity<AddressId> { toSnapshot() { return { id: this.id.value }; } }`,
			)
			.file(
				"src/ordering/domain/value-objects/shipping.value-object.ts",
				`import { ValueObject } from "@alveolus/core";
				import type { Address } from "../entities/address.entity.ts";
				export class Shipping extends ValueObject<{ address: Address }> {}`,
			)
			.file(
				"src/ordering/domain/aggregates/customer.aggregate.ts",
				`import { AggregateRoot, Identifier } from "@alveolus/core";
				import type { Address } from "../entities/address.entity.ts";
				class CustomerId extends Identifier<string, "CustomerId"> {}
				export class Customer extends AggregateRoot<CustomerId> {
					private constructor(id: CustomerId, private readonly address: Address) { super(id); }
					toSnapshot() { return { id: this.id.value }; }
				}`,
			)
			.file(
				"src/ordering/domain/aggregates/order.aggregate.ts",
				`import { AggregateRoot, Identifier } from "@alveolus/core";
				import type { Shipping } from "../value-objects/shipping.value-object.ts";
				class OrderId extends Identifier<string, "OrderId"> {}
				export class Order extends AggregateRoot<OrderId> {
					private constructor(id: OrderId, private readonly shipping: Shipping) { super(id); }
					toSnapshot() { return { id: this.id.value }; }
				}`,
			);

		expect(codebase.messages(new NoAggregateReferenceRule())).toEqual([
			"Customer.address holds the entity Address, which Order holds too: an entity belongs to one aggregate.",
			"Order.shipping holds the entity Address, which Customer holds too: an entity belongs to one aggregate.",
		]);
	});
});
