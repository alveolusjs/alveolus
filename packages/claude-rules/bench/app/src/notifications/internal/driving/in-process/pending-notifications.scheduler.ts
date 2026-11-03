import { type BeforeApplicationShutdown, Logger, type OnApplicationBootstrap } from '@nestjs/common';

import type { NotificationService } from '../../application/notification.service';

export class PendingNotificationsScheduler implements OnApplicationBootstrap, BeforeApplicationShutdown {
	readonly #notifications: NotificationService;
	readonly #intervalMs: number;
	readonly #logger = new Logger(PendingNotificationsScheduler.name);
	#timer: NodeJS.Timeout | undefined;
	#run: Promise<void> = Promise.resolve();

	constructor(notifications: NotificationService, intervalMs: number) {
		this.#notifications = notifications;
		this.#intervalMs = intervalMs;
	}

	onApplicationBootstrap(): void {
		this.#timer = setInterval(() => {
			this.#run = this.#run.then(() => this.#sendPending());
		}, this.#intervalMs);
	}

	async beforeApplicationShutdown(): Promise<void> {
		clearInterval(this.#timer);
		await this.#run;
	}

	async #sendPending(): Promise<void> {
		for (const notificationId of await this.#notifications.listPending(100)) {
			const sent = await this.#notifications.send(notificationId);

			if (!sent.ok) {
				this.#logger.warn({ event: 'notification.not-sent', notificationId, reason: sent.error.type });
			}
		}
	}
}
