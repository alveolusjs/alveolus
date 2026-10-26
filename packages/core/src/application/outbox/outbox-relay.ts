import type { EventPublisher } from '../event-publishers/index.ts';
import type { Outbox } from './outbox.ts';

const defaultChannel = 'default';
const defaultBatchSize = 100;

export class OutboxRelay {
	public constructor(
		private readonly outbox: Outbox,
		private readonly publisher: EventPublisher,
		private readonly channel: string = defaultChannel,
		private readonly batchSize: number = defaultBatchSize,
	) {}

	public async relay(): Promise<number> {
		const lastPublished = await this.outbox.lastPublished(this.channel);
		const stored = await this.outbox.pending(lastPublished, this.batchSize);
		const last = stored.at(-1);

		if (last === undefined) {
			return 0;
		}

		await this.publisher.publish(stored.map((entry) => entry.event));
		await this.outbox.recordPublished(this.channel, last.sequence);

		return stored.length;
	}
}
