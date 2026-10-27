import { AsyncLocalStorage } from 'node:async_hooks';

import { EventPublisher } from '../../src/application/event-publishers/index.ts';
import type { AnyIntegrationEvent } from '../../src/application/integration-events/index.ts';
import { Outbox, type StoredEvent } from '../../src/application/outbox/index.ts';
import { type TransactionScope, UnitOfWork } from '../../src/application/unit-of-work/index.ts';

export class RecordingUnitOfWork extends UnitOfWork {
	public readonly log: string[] = [];
	readonly #scopes = new AsyncLocalStorage<TransactionScope>();
	#count = 0;

	protected current(): TransactionScope | undefined {
		return this.#scopes.getStore();
	}

	protected async transaction<R>(scope: TransactionScope, work: () => Promise<R>): Promise<R> {
		this.#count += 1;
		const name = `tx${this.#count}`;
		this.log.push(`${name}:begin`);

		try {
			const result = await this.#scopes.run(scope, work);
			this.log.push(`${name}:commit`);
			return result;
		} catch (error) {
			this.log.push(`${name}:rollback`);
			throw error;
		}
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
