import { EventPublisher } from '../../src/application/event-publishers/index.ts';
import type { AnyIntegrationEvent } from '../../src/application/integration-events/index.ts';
import { Outbox, type StoredEvent } from '../../src/application/outbox/index.ts';
import { Transaction, UnitOfWork } from '../../src/application/unit-of-work/index.ts';

class RecordingTransaction extends Transaction {
	readonly #name: string;
	readonly #log: string[];

	public constructor(name: string, log: string[]) {
		super();
		this.#name = name;
		this.#log = log;
	}

	public commit(): Promise<void> {
		this.#log.push(`${this.#name}:commit`);
		return Promise.resolve();
	}

	public rollback(): Promise<void> {
		this.#log.push(`${this.#name}:rollback`);
		return Promise.resolve();
	}
}

export class RecordingUnitOfWork extends UnitOfWork {
	public readonly log: string[] = [];
	#count = 0;

	protected begin(): Promise<Transaction> {
		this.#count += 1;
		const name = `tx${this.#count}`;
		this.log.push(`${name}:begin`);
		return Promise.resolve(new RecordingTransaction(name, this.log));
	}
}

export class InMemoryOutbox extends Outbox {
	readonly #stored: StoredEvent[] = [];
	readonly #positions = new Map<string, number>();

	public add(events: readonly AnyIntegrationEvent[]): Promise<void> {
		for (const event of events) {
			this.#stored.push({ sequence: this.#stored.length + 1, event });
		}
		return Promise.resolve();
	}

	public pending(after: number, limit: number): Promise<readonly StoredEvent[]> {
		return Promise.resolve(this.#stored.filter((entry) => entry.sequence > after).slice(0, limit));
	}

	public lastPublished(channel: string): Promise<number> {
		return Promise.resolve(this.#positions.get(channel) ?? 0);
	}

	public recordPublished(channel: string, sequence: number): Promise<void> {
		this.#positions.set(channel, sequence);
		return Promise.resolve();
	}
}

export class FailingEventPublisher extends EventPublisher {
	public publish(): Promise<void> {
		return Promise.reject(new Error('broker unavailable'));
	}
}
