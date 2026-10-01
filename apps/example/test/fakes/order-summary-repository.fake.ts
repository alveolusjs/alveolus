import type { OrderSummary, OrderSummaryRepository } from "../../src/ordering/index.ts";

export class FakeOrderSummaryRepository implements OrderSummaryRepository {
	public constructor(private readonly summaries: readonly OrderSummary[]) {}

	public findById(orderId: string): Promise<OrderSummary | undefined> {
		return Promise.resolve(this.summaries.find((summary) => summary.id === orderId));
	}
}
