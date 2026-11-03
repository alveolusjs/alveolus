import type { OnModuleInit } from '@nestjs/common';
import { z } from 'zod';

import type { IntegrationConsumer } from '../../../../shared/driving/in-process/integration.consumer';
import { MONEY_WITHDRAWN } from '../../../../wallets/public/wallets.integration-events';
import type { NotificationService } from '../../application/notification.service';

export class MoneyWithdrawnConsumer implements OnModuleInit {
	static readonly #money = z.object({ minor: z.string().regex(/^\d+$/), currency: z.string().length(3) });

	static readonly #incoming = z.object({
		id: z.uuid(),
		type: z.literal(MONEY_WITHDRAWN),
		version: z.literal(1),
		payload: z.object({
			customerId: z.uuid(),
			amount: MoneyWithdrawnConsumer.#money,
			balance: MoneyWithdrawnConsumer.#money,
		}),
	});

	readonly #consumer: IntegrationConsumer;
	readonly #notifications: NotificationService;

	constructor(consumer: IntegrationConsumer, notifications: NotificationService) {
		this.#consumer = consumer;
		this.#notifications = notifications;
	}

	onModuleInit(): void {
		this.#consumer.on(
			MONEY_WITHDRAWN,
			'notifications.withdrawal-receipt',
			(raw) => MoneyWithdrawnConsumer.#incoming.parse(raw),
			(withdrawn) => this.#notifications.recordWithdrawalReceipt(withdrawn.payload),
		);
	}
}
