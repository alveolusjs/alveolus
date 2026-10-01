import { AggregateRoot } from "../../src/domain/aggregates/index.ts";
import { Entity, Identifier } from "../../src/domain/entities/index.ts";

export class OrderId extends Identifier<string, "OrderId"> {}

export class OrderLineId extends Identifier<string, "OrderLineId"> {}

export class CustomerId extends Identifier<string, "CustomerId"> {}

export type OrderLineSnapshot = { id: string; quantity: number };

export type OrderSnapshot = { id: string; lines: OrderLineSnapshot[] };

export class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> {
	private readonly quantity: number;

	public constructor(id: OrderLineId, quantity: number) {
		super(id);
		this.quantity = quantity;
	}

	public static fromSnapshot(snapshot: OrderLineSnapshot): OrderLine {
		return new OrderLine(new OrderLineId(snapshot.id), snapshot.quantity);
	}

	public toSnapshot(): OrderLineSnapshot {
		return { id: this.id.value, quantity: this.quantity };
	}
}

export class Order extends AggregateRoot<OrderId, OrderSnapshot> {
	private readonly lines: readonly OrderLine[];

	public constructor(id: OrderId, version: number, lines: readonly OrderLine[] = []) {
		super(id, { version });
		this.lines = lines;
	}

	public static fromSnapshot(snapshot: OrderSnapshot, version: number): Order {
		return new Order(new OrderId(snapshot.id), version, snapshot.lines.map(OrderLine.fromSnapshot));
	}

	public toSnapshot(): OrderSnapshot {
		return { id: this.id.value, lines: this.lines.map((line) => line.toSnapshot()) };
	}
}

export interface InterfaceSnapshot {
	id: string;
}

// @ts-expect-error
export class InterfaceShipment extends AggregateRoot<OrderId, InterfaceSnapshot> {
	public toSnapshot(): InterfaceSnapshot {
		return { id: this.id.value };
	}
}

// @ts-expect-error
export class DatedShipment extends AggregateRoot<OrderId, { shippedAt: Date }> {
	public toSnapshot(): { shippedAt: Date } {
		return { shippedAt: new Date(0) };
	}
}

// @ts-expect-error
export class ShipmentWithoutSnapshot extends AggregateRoot<OrderId, { id: string }> {}
