import type { EventPublisher } from '../event-publishers/index.ts';
import type { Outbox } from './outbox.ts';

const defaultChannel = 'default';
const defaultBatchSize = 100;

export class OutboxRelay {
	readonly #outbox: Outbox;
	readonly #publisher: EventPublisher;
	readonly #channel: string;
	readonly #batchSize: number;

	public constructor(
		outbox: Outbox,
		publisher: EventPublisher,
		channel: string = defaultChannel,
		batchSize: number = defaultBatchSize,
	) {
		this.#outbox = outbox;
		this.#publisher = publisher;
		this.#channel = channel;
		this.#batchSize = batchSize;
	}

	public async relay(): Promise<number> {
		const lastPublished = await this.#outbox.lastPublished(this.#channel);
		const stored = await this.#outbox.pending(lastPublished, this.#batchSize);
		const last = stored.at(-1);

		if (last === undefined) {
			return 0;
		}

		await this.#publisher.publish(stored.map((entry) => entry.event));
		await this.#outbox.recordPublished(this.#channel, last.sequence);

		return stored.length;
	}
}
