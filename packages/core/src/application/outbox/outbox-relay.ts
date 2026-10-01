import type { EventPublisher } from "../event-publishers/index.ts";
import type { Outbox } from "./outbox.ts";

const defaultBatchSize = 100;

export class OutboxRelay {
	public constructor(
		private readonly outbox: Outbox,
		private readonly publisher: EventPublisher,
		private readonly batchSize: number = defaultBatchSize,
	) {}

	public async relay(): Promise<number> {
		const events = await this.outbox.pending(this.batchSize);

		if (events.length === 0) {
			return 0;
		}

		await this.publisher.publish(events);
		await this.outbox.markPublished(events.map((event) => event.id));

		return events.length;
	}
}
