import { EventPublisher } from "../../src/application/event-publishers/index.ts";
import type { AnyIntegrationEvent } from "../../src/application/integration-events/index.ts";
import { Outbox } from "../../src/application/outbox/index.ts";
import { Transaction, UnitOfWork } from "../../src/application/unit-of-work/index.ts";

class RecordingTransaction extends Transaction {
	public constructor(
		private readonly name: string,
		private readonly log: string[],
	) {
		super();
	}

	public commit(): Promise<void> {
		this.log.push(`${this.name}:commit`);
		return Promise.resolve();
	}

	public rollback(): Promise<void> {
		this.log.push(`${this.name}:rollback`);
		return Promise.resolve();
	}
}

export class RecordingUnitOfWork extends UnitOfWork {
	public readonly log: string[] = [];
	private count = 0;

	protected begin(): Promise<Transaction> {
		this.count += 1;
		const name = `tx${this.count}`;
		this.log.push(`${name}:begin`);
		return Promise.resolve(new RecordingTransaction(name, this.log));
	}
}

export class InMemoryOutbox extends Outbox {
	private readonly events: AnyIntegrationEvent[] = [];
	private readonly published = new Set<string>();

	public add(events: readonly AnyIntegrationEvent[]): Promise<void> {
		this.events.push(...events);
		return Promise.resolve();
	}

	public pending(limit: number): Promise<readonly AnyIntegrationEvent[]> {
		return Promise.resolve(this.events.filter((event) => !this.published.has(event.id)).slice(0, limit));
	}

	public markPublished(ids: readonly string[]): Promise<void> {
		for (const id of ids) {
			this.published.add(id);
		}
		return Promise.resolve();
	}
}

export class FailingEventPublisher extends EventPublisher {
	public publish(): Promise<void> {
		return Promise.reject(new Error("broker unavailable"));
	}
}
