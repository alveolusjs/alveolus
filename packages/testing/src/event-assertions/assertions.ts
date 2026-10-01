import type { AnyDomainEvent } from "@alveolus/core";

import { AssertionError } from "node:assert";
import { isDeepStrictEqual } from "node:util";

export interface RecordsDomainEvents {
	readonly domainEvents: readonly AnyDomainEvent[];
}

export type DomainEventClass<Event extends AnyDomainEvent> = abstract new (...args: never[]) => Event;

function describeEvents(events: readonly AnyDomainEvent[]): string {
	return events.length === 0 ? "none" : events.map((event) => event.type).join(", ");
}

export function assertRecorded<Event extends AnyDomainEvent>(
	aggregate: RecordsDomainEvents,
	eventClass: DomainEventClass<Event>,
	...expected: [] | [payload: Event["payload"]]
): Event {
	const recorded = aggregate.domainEvents;
	const candidates = recorded.filter((event): event is Event => event instanceof eventClass);

	if (candidates.length === 0) {
		throw new AssertionError({
			message: `Expected ${eventClass.name} to be recorded, recorded: ${describeEvents(recorded)}`,
		});
	}
	if (expected.length === 0) {
		return candidates[0] as Event;
	}

	const [payload] = expected;
	const match = candidates.find((event) => isDeepStrictEqual(event.payload, payload));
	if (match === undefined) {
		throw new AssertionError({
			actual: candidates.length === 1 ? candidates[0]?.payload : candidates.map((e) => e.payload),
			expected: payload,
			message: `Expected ${eventClass.name} to be recorded with the given payload`,
			operator: "deepStrictEqual",
		});
	}
	return match;
}

export function assertRecordedNothing(aggregate: RecordsDomainEvents): void {
	const recorded = aggregate.domainEvents;
	if (recorded.length > 0) {
		throw new AssertionError({
			message: `Expected no recorded events, recorded: ${describeEvents(recorded)}`,
		});
	}
}
