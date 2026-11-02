import type { DomainEventRecord } from './domain-event-record.ts';

export type StoredDomainEvent = {
	readonly sequence: number;
	readonly event: DomainEventRecord;
};
