import { OrderLine } from "../../src/ordering/domain/entities/order-line.entity.ts";
import { OrderLineId } from "../../src/ordering/domain/value-objects/order-line-id.identifier.ts";
import { ProductId } from "../../src/ordering/domain/value-objects/product-id.identifier.ts";
import type { Money } from "../../src/shared-kernel/domain/value-objects/money.value-object.ts";
import { MoneyBuilder } from "./money.builder.ts";

export class OrderLineBuilder {
	private id = "lin_1";
	private productId = "prd_1";
	private unitPrice: Money = new MoneyBuilder().build();
	private quantity = 1;

	public withId(id: string): this {
		this.id = id;
		return this;
	}

	public withProductId(productId: string): this {
		this.productId = productId;
		return this;
	}

	public withUnitPrice(unitPrice: Money): this {
		this.unitPrice = unitPrice;
		return this;
	}

	public withQuantity(quantity: number): this {
		this.quantity = quantity;
		return this;
	}

	public build(): OrderLine {
		const line = OrderLine.create(
			new OrderLineId(this.id),
			new ProductId(this.productId),
			this.unitPrice,
			this.quantity,
		);
		if (!line.ok) {
			throw new Error(`OrderLineBuilder: invalid quantity ${this.quantity}`);
		}
		return line.value;
	}
}
