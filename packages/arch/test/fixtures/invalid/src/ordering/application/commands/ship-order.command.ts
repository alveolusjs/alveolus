import { ok } from "@alveolus/core";
import type { CommandHandler, NotificationPublisher, Result } from "@alveolus/core";

import type { ShipOrder } from "../ship-order.ts";
import type { Trace } from "../trace.ts";

export class ShipOrderHandler implements CommandHandler<ShipOrder> {
	public constructor(private readonly notifications: NotificationPublisher<Trace>) {}

	public async handle(): Promise<Result<void, never>> {
		await this.notifications.publish([]);
		return ok();
	}
}
