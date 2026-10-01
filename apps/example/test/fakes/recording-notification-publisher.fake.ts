import type { AnyDomainEvent, Notification, NotificationPublisher } from "@alveolus/core";

import type { Audit } from "../../src/ordering/index.ts";

export class RecordingNotificationPublisher implements NotificationPublisher<Audit> {
	public readonly published: Notification<AnyDomainEvent, Audit>[] = [];

	public publish(notifications: readonly Notification<AnyDomainEvent, Audit>[]): Promise<void> {
		this.published.push(...notifications);
		return Promise.resolve();
	}
}
