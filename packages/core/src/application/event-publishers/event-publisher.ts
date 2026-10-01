import { Port } from "../../domain/ports/index.ts";
import type { AnyIntegrationEvent } from "../integration-events/index.ts";

export abstract class EventPublisher extends Port {
	public abstract publish(events: readonly AnyIntegrationEvent[]): Promise<void>;
}
