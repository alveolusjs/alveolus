import type { AnyIntegrationEvent } from '../integration-events/index.ts';

export type StoredIntegrationEvent = {
	readonly sequence: number;
	readonly event: AnyIntegrationEvent;
};
