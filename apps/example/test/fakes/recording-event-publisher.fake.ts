import type { AnyDomainEvent, EventPublisher } from "@alveolus/core";

export class RecordingEventPublisher implements EventPublisher {
	public readonly published: AnyDomainEvent[] = [];

	public publish(events: readonly AnyDomainEvent[]): Promise<void> {
		this.published.push(...events);
		return Promise.resolve();
	}
}
