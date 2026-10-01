import type { OrderStatus } from "../aggregates/order.aggregate.ts";

export type OrderSummary = {
	id: string;
	customerId: string;
	status: OrderStatus;
	total: number;
	currency: string;
	lineCount: number;
};
