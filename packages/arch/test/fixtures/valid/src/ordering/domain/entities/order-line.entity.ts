import { andThen, Entity, err, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { Currency } from "../../../shared-kernel/domain/value-objects/currency.value-object.ts";
import { Money } from "../../../shared-kernel/domain/value-objects/money.value-object.ts";
import { InvalidQuantity } from "../errors/order.error.ts";
import { OrderLineId, ProductId } from "../value-objects/ids.identifier.ts";

export type OrderLineSnapshot = {
	id: string;
	productId: string;
	unitPrice: { amount: number; currency: string };
	quantity: number;
};

export class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> {
	public readonly productId: ProductId;
	public readonly unitPrice: Money;
	private quantity: number;

	private constructor(id: OrderLineId, productId: ProductId, unitPrice: Money, quantity: number) {
		super(id);
		this.productId = productId;
		this.unitPrice = unitPrice;
		this.quantity = quantity;
	}

	public static create(id: OrderLineId, productId: ProductId, unitPrice: Money): OrderLine {
		return new OrderLine(id, productId, unitPrice, 1);
	}

	public static fromSnapshot(snapshot: OrderLineSnapshot): OrderLine {
		const unitPrice = andThen(Currency.create(snapshot.unitPrice.currency), (currency) =>
			Money.create(snapshot.unitPrice.amount, currency),
		);
		if (!unitPrice.ok) {
			throw new Error(`Order line ${snapshot.id} has a corrupted unit price`);
		}
		return new OrderLine(
			new OrderLineId(snapshot.id),
			new ProductId(snapshot.productId),
			unitPrice.value,
			snapshot.quantity,
		);
	}

	public get total(): Money {
		return this.unitPrice.times(this.quantity);
	}

	public changeQuantity(quantity: number): Result<void, InvalidQuantity> {
		if (quantity <= 0) {
			return err(new InvalidQuantity({ quantity }));
		}
		this.quantity = quantity;
		return ok();
	}

	public toSnapshot(): OrderLineSnapshot {
		return {
			id: this.id.value,
			productId: this.productId.value,
			quantity: this.quantity,
			unitPrice: { amount: this.unitPrice.amount, currency: this.unitPrice.currency.code },
		};
	}
}
