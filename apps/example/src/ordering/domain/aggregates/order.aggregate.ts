import { AggregateRoot, err, map, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { Currency } from "../../../shared-kernel/domain/value-objects/currency.value-object.ts";
import type { Money } from "../../../shared-kernel/domain/value-objects/money.value-object.ts";
import type { OrderLineSnapshot } from "../entities/order-line.entity.ts";
import { OrderLine } from "../entities/order-line.entity.ts";
import { CurrencyMismatch } from "../errors/currency-mismatch.error.ts";
import { EmptyOrder } from "../errors/empty-order.error.ts";
import type { InvalidQuantity } from "../errors/invalid-quantity.error.ts";
import { OrderAlreadyCancelled } from "../errors/order-already-cancelled.error.ts";
import { OrderNotDraft } from "../errors/order-not-draft.error.ts";
import { OrderCancelled } from "../events/order-cancelled.event.ts";
import { OrderPlaced } from "../events/order-placed.event.ts";
import { CustomerId } from "../value-objects/customer-id.identifier.ts";
import { OrderId } from "../value-objects/order-id.identifier.ts";
import type { OrderLineId } from "../value-objects/order-line-id.identifier.ts";
import type { ProductId } from "../value-objects/product-id.identifier.ts";

export type OrderStatus = "draft" | "placed" | "cancelled";

export type OrderSnapshot = {
	id: string;
	customerId: string;
	currency: string;
	status: OrderStatus;
	placedAt: string | null;
	lines: OrderLineSnapshot[];
};

type OrderEvent = OrderPlaced | OrderCancelled;

export class Order extends AggregateRoot<OrderId, OrderSnapshot, OrderEvent> {
	public readonly customerId: CustomerId;
	public readonly currency: Currency;
	private status: OrderStatus;
	private placedAt: Date | null;
	private readonly lines: OrderLine[];

	private constructor(
		id: OrderId,
		customerId: CustomerId,
		currency: Currency,
		state: { status: OrderStatus; placedAt: Date | null; lines: OrderLine[]; version: number },
	) {
		super(id, { version: state.version });
		this.customerId = customerId;
		this.currency = currency;
		this.status = state.status;
		this.placedAt = state.placedAt;
		this.lines = state.lines;
	}

	public static create(id: OrderId, customerId: CustomerId, currency: Currency): Order {
		return new Order(id, customerId, currency, { lines: [], placedAt: null, status: "draft", version: 0 });
	}

	public static fromSnapshot(snapshot: OrderSnapshot, version: number): Order {
		const currency = Currency.create(snapshot.currency);
		if (!currency.ok) {
			throw new Error(`Order ${snapshot.id} has a corrupted currency`);
		}
		return new Order(new OrderId(snapshot.id), new CustomerId(snapshot.customerId), currency.value, {
			lines: snapshot.lines.map((line) => OrderLine.fromSnapshot(line)),
			placedAt: snapshot.placedAt === null ? null : new Date(snapshot.placedAt),
			status: snapshot.status,
			version,
		});
	}

	public get total(): number {
		return this.lines.reduce((sum, line) => sum + line.total.amount, 0);
	}

	public addLine(
		lineId: OrderLineId,
		productId: ProductId,
		unitPrice: Money,
		quantity: number,
	): Result<void, OrderNotDraft | CurrencyMismatch | InvalidQuantity> {
		if (this.status !== "draft") {
			return err(new OrderNotDraft({ status: this.status }));
		}
		if (!unitPrice.currency.equals(this.currency)) {
			return err(new CurrencyMismatch({ actual: unitPrice.currency.code, expected: this.currency.code }));
		}
		return map(OrderLine.create(lineId, productId, unitPrice, quantity), (line) => {
			this.lines.push(line);
		});
	}

	public place(now: Date): Result<void, OrderNotDraft | EmptyOrder> {
		if (this.status !== "draft") {
			return err(new OrderNotDraft({ status: this.status }));
		}
		if (this.lines.length === 0) {
			return err(new EmptyOrder());
		}
		this.status = "placed";
		this.placedAt = new Date(now);
		this.record(
			new OrderPlaced({
				aggregateId: this.id,
				occurredAt: now,
				payload: { currency: this.currency.code, customerId: this.customerId.value, total: this.total },
			}),
		);
		return ok();
	}

	public cancel(reason: string, now: Date): Result<void, OrderAlreadyCancelled> {
		if (this.status === "cancelled") {
			return err(new OrderAlreadyCancelled());
		}
		this.status = "cancelled";
		this.record(new OrderCancelled({ aggregateId: this.id, occurredAt: now, payload: { reason } }));
		return ok();
	}

	public toSnapshot(): OrderSnapshot {
		return {
			currency: this.currency.code,
			customerId: this.customerId.value,
			id: this.id.value,
			lines: this.lines.map((line) => line.toSnapshot()),
			placedAt: this.placedAt?.toISOString() ?? null,
			status: this.status,
		};
	}
}
