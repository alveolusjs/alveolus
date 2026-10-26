import { Port } from '../../domain/ports/index.ts';
import type { AnyIntegrationEvent } from '../integration-events/index.ts';
import type { StoredEvent } from './stored-event.ts';

export abstract class Outbox extends Port {
	public abstract add(events: readonly AnyIntegrationEvent[]): Promise<void>;
	public abstract pending(after: number, limit: number): Promise<readonly StoredEvent[]>;
	public abstract lastPublished(channel: string): Promise<number>;
	public abstract recordPublished(channel: string, sequence: number): Promise<void>;
}
