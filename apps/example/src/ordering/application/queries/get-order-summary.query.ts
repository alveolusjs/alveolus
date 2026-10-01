import { err, ok } from "@alveolus/core";
import type { QueryHandler, Result } from "@alveolus/core";

import { OrderNotFound } from "../../domain/errors/order-not-found.error.ts";
import type { OrderSummaryRepository } from "../../domain/repositories/order-summary.repository.ts";
import type { OrderSummary } from "../../domain/views/order-summary.view.ts";

export type GetOrderSummary = {
	orderId: string;
};

export class GetOrderSummaryHandler implements QueryHandler<GetOrderSummary, OrderSummary, OrderNotFound> {
	public constructor(private readonly summaries: OrderSummaryRepository) {}

	public async handle({ orderId }: GetOrderSummary): Promise<Result<OrderSummary, OrderNotFound>> {
		const summary = await this.summaries.findById(orderId);
		return summary === undefined ? err(new OrderNotFound({ orderId })) : ok(summary);
	}
}
