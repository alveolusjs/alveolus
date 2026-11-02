import { Port } from '../../domain/ports/index.ts';
import type { AnyIntegrationEvent } from '../integration-events/index.ts';
import type { DomainEventRecord } from './domain-event-record.ts';
import type { StoredDomainEvent } from './stored-domain-event.ts';
import type { StoredIntegrationEvent } from './stored-integration-event.ts';

export abstract class Outbox extends Port {
	public abstract add(events: readonly AnyIntegrationEvent[]): Promise<void>;
	public abstract addDomainEvents(events: readonly DomainEventRecord[]): Promise<void>;
	public abstract pending(after: number, limit: number): Promise<readonly StoredIntegrationEvent[]>;
	public abstract pendingDomainEvents(
		source: string,
		after: number,
		limit: number,
	): Promise<readonly StoredDomainEvent[]>;
	public abstract lastPublished(channel: string): Promise<number>;
	public abstract recordPublished(channel: string, sequence: number): Promise<void>;
	public abstract recordFailure(channel: string, sequence: number): Promise<number>;
	public abstract recordDeadLetter(channel: string, sequence: number): Promise<void>;
}
