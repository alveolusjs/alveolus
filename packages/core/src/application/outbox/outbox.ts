import { Port } from "../../domain/ports/index.ts";
import type { AnyIntegrationEvent } from "../integration-events/index.ts";

export abstract class Outbox extends Port {
	public abstract add(events: readonly AnyIntegrationEvent[]): Promise<void>;
	public abstract pending(limit: number): Promise<readonly AnyIntegrationEvent[]>;
	public abstract markPublished(ids: readonly string[]): Promise<void>;
}
