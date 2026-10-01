import type { OrderSummaryRepository } from "../domain/repositories/order-summary.repository.ts";
import type { OrderSummary } from "../domain/views/order-summary.view.ts";

export class SqlOrderSummaryRepository implements OrderSummaryRepository {
	public constructor(private readonly query: (sql: string, id: string) => Promise<OrderSummary | undefined>) {}

	public findById(orderId: string): Promise<OrderSummary | undefined> {
		return this.query("SELECT id, placed FROM order_summaries WHERE id = $1", orderId);
	}
}
