import { Order } from "../../src/ordering/domain/aggregates/order.aggregate.ts";
import { CustomerId } from "../../src/ordering/domain/value-objects/customer-id.identifier.ts";
import { OrderId } from "../../src/ordering/domain/value-objects/order-id.identifier.ts";
import { OrderLineId } from "../../src/ordering/domain/value-objects/order-line-id.identifier.ts";
import { ProductId } from "../../src/ordering/domain/value-objects/product-id.identifier.ts";
import type { Money } from "../../src/shared-kernel/domain/value-objects/money.value-object.ts";
import { CurrencyBuilder } from "./currency.builder.ts";
import { MoneyBuilder } from "./money.builder.ts";

type Line = { id: string; productId: string; unitPrice: Money; quantity: number };

export class OrderBuilder {
	private id = "ord_1";
	private customerId = "cus_1";
	private currency = "EUR";
	private readonly lines: Line[] = [];
	private placedAt: Date | undefined;
	private cancellation: { reason: string; at: Date } | undefined;

	public withId(id: string): this {
		this.id = id;
		return this;
	}

	public withCustomerId(customerId: string): this {
		this.customerId = customerId;
		return this;
	}

	public withCurrency(code: string): this {
		this.currency = code;
		return this;
	}

	public withLine(line: Partial<Line> = {}): this {
		this.lines.push({
			id: line.id ?? `lin_${this.lines.length + 1}`,
			productId: line.productId ?? `prd_${this.lines.length + 1}`,
			quantity: line.quantity ?? 1,
			unitPrice: line.unitPrice ?? new MoneyBuilder().withCurrency(this.currency).build(),
		});
		return this;
	}

	public placed(at: Date): this {
		this.placedAt = at;
		return this;
	}

	public cancelled(reason: string, at: Date): this {
		this.cancellation = { at, reason };
		return this;
	}

	public build(): Order {
		const order = Order.create(
			new OrderId(this.id),
			new CustomerId(this.customerId),
			new CurrencyBuilder().withCode(this.currency).build(),
		);
		for (const line of this.lines) {
			const added = order.addLine(
				new OrderLineId(line.id),
				new ProductId(line.productId),
				line.unitPrice,
				line.quantity,
			);
			if (!added.ok) {
				throw new Error(`OrderBuilder: cannot add line ${line.id}, ${added.error.type}`);
			}
		}
		if (this.placedAt !== undefined && !order.place(this.placedAt).ok) {
			throw new Error("OrderBuilder: cannot place the order");
		}
		if (this.cancellation !== undefined && !order.cancel(this.cancellation.reason, this.cancellation.at).ok) {
			throw new Error("OrderBuilder: cannot cancel the order");
		}
		return order;
	}
}
