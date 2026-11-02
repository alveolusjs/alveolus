import { AsyncLocalStorage } from 'node:async_hooks';

import { type Correlation, CorrelationContext } from '../../src/application/correlation-contexts/index.ts';
import { EventPublisher } from '../../src/application/event-publishers/index.ts';
import type { AnyIntegrationEvent } from '../../src/application/integration-events/index.ts';
import {
	type DomainEventRecord,
	Outbox,
	type StoredDomainEvent,
	type StoredIntegrationEvent,
} from '../../src/application/outbox/index.ts';
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
	readonly #integrationEvents: StoredIntegrationEvent[] = [];
	readonly #domainEvents: StoredDomainEvent[] = [];
	readonly #positions = new Map<string, number>();
	readonly #failures = new Map<string, number>();
	readonly #deadLetters: string[] = [];
	#sequence = 0;

	public get deadLetters(): readonly string[] {
		return this.#deadLetters;
	}

	public add(events: readonly AnyIntegrationEvent[]): Promise<void> {
		for (const event of events) {
			this.#integrationEvents.push({ sequence: this.#next(), event });
		}

		return Promise.resolve();
	}

	public addDomainEvents(events: readonly DomainEventRecord[]): Promise<void> {
		for (const event of events) {
			this.#domainEvents.push({ sequence: this.#next(), event });
		}

		return Promise.resolve();
	}

	public pending(after: number, limit: number): Promise<readonly StoredIntegrationEvent[]> {
		return Promise.resolve(this.#visible(this.#integrationEvents, after).slice(0, limit));
	}

	public pendingDomainEvents(source: string, after: number, limit: number): Promise<readonly StoredDomainEvent[]> {
		const visible = this.#visible(this.#domainEvents, after);

		return Promise.resolve(visible.filter((entry) => entry.event.source === source).slice(0, limit));
	}

	public lastPublished(channel: string): Promise<number> {
		return Promise.resolve(this.#positions.get(channel) ?? 0);
	}

	public recordPublished(channel: string, sequence: number): Promise<void> {
		this.#positions.set(channel, sequence);
		return Promise.resolve();
	}

	public recordFailure(channel: string, sequence: number): Promise<number> {
		const key = `${channel}#${sequence}`;
		const attempts = (this.#failures.get(key) ?? 0) + 1;
		this.#failures.set(key, attempts);
		return Promise.resolve(attempts);
	}

	public recordDeadLetter(channel: string, sequence: number): Promise<void> {
		this.#deadLetters.push(`${channel}#${sequence}`);
		return Promise.resolve();
	}

	protected get latestSequence(): number {
		return this.#sequence;
	}

	protected horizon(): number {
		return Number.POSITIVE_INFINITY;
	}

	#visible<Entry extends { readonly sequence: number }>(entries: readonly Entry[], after: number): Entry[] {
		const horizon = this.horizon();

		return entries.filter((entry) => entry.sequence > after && entry.sequence < horizon);
	}

	#next(): number {
		this.#sequence += 1;
		return this.#sequence;
	}
}

export class LateCommitOutbox extends InMemoryOutbox {
	readonly #uncommitted = new Set<number>();

	public async addUncommitted(events: readonly AnyIntegrationEvent[]): Promise<void> {
		const first = this.latestSequence + 1;
		await this.add(events);

		for (let sequence = first; sequence <= this.latestSequence; sequence += 1) {
			this.#uncommitted.add(sequence);
		}
	}

	public commitPending(): void {
		this.#uncommitted.clear();
	}

	protected override horizon(): number {
		return Math.min(...this.#uncommitted);
	}
}

export class FailingEventPublisher extends EventPublisher {
	public publish(): Promise<void> {
		return Promise.reject(new Error('broker unavailable'));
	}
}

export class ScopedCorrelationContext extends CorrelationContext {
	readonly #scopes = new AsyncLocalStorage<Correlation>();

	public run<T>(correlation: Correlation, work: () => Promise<T>): Promise<T> {
		return this.#scopes.run(correlation, work);
	}

	protected active(): Correlation | undefined {
		return this.#scopes.getStore();
	}
}
