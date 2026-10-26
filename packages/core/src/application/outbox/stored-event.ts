import type { AnyIntegrationEvent } from '../integration-events/index.ts';

export type StoredEvent = {
	readonly sequence: number;
	readonly event: AnyIntegrationEvent;
};
