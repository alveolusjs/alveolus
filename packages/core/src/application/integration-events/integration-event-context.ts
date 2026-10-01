export interface IntegrationEventContext {
	readonly correlationId: string;
	readonly causationId?: string;
}
