import type { ViewRepository } from "@alveolus/core";

import type { OrderSummary } from "../views/order-summary.view.ts";

export interface OrderSummaryRepository extends ViewRepository<OrderSummary> {
	findById(orderId: string): Promise<OrderSummary | undefined>;
}
