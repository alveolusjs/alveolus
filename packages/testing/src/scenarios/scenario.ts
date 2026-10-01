import type { AnyAggregateRoot, AnyDomainError, AnyDomainEvent, Result } from "@alveolus/core";

import { AssertionError } from "node:assert";
import { isDeepStrictEqual } from "node:util";

import type { DomainEventClass } from "../event-assertions/index.ts";
import { assertRecorded, assertRecordedNothing } from "../event-assertions/index.ts";

export type DomainErrorClass<Error extends AnyDomainError> = abstract new (...args: never[]) => Error;

function isResult(value: unknown): value is Result<unknown, unknown> {
	return typeof value === "object" && value !== null && "ok" in value && typeof value.ok === "boolean";
}

function describeResult(value: unknown): string {
	if (!isResult(value)) {
		return `the action returned ${value === undefined ? "undefined" : typeof value}, not a Result`;
	}
	if (value.ok) {
		return "the action succeeded";
	}
	const { error } = value;
	return `the action failed with ${typeof error === "object" && error !== null ? error.constructor.name : String(error)}`;
}

export class Scenario<Aggregate extends AnyAggregateRoot, Returned> {
	public readonly aggregate: Aggregate;
	public readonly result: Returned;

	public constructor(aggregate: Aggregate, result: Returned) {
		this.aggregate = aggregate;
		this.result = result;
	}

	public thenSucceeded(): this {
		if (!isResult(this.result) || !this.result.ok) {
			throw new AssertionError({ message: `Expected the action to succeed, but ${describeResult(this.result)}` });
		}
		return this;
	}

	public thenFailedWith<Error extends AnyDomainError>(
		errorClass: DomainErrorClass<Error>,
		...expected: [] | [payload: Error["payload"]]
	): this {
		const { result } = this;
		if (!isResult(result) || result.ok || !(result.error instanceof errorClass)) {
			throw new AssertionError({
				message: `Expected the action to fail with ${errorClass.name}, but ${describeResult(result)}`,
			});
		}
		if (expected.length > 0 && !isDeepStrictEqual(result.error.payload, expected[0])) {
			throw new AssertionError({
				actual: result.error.payload,
				expected: expected[0],
				message: `Expected the action to fail with ${errorClass.name} and the given payload`,
				operator: "deepStrictEqual",
			});
		}
		return this;
	}

	public thenRecorded<Event extends AnyDomainEvent>(
		eventClass: DomainEventClass<Event>,
		...expected: [] | [payload: Event["payload"]]
	): this {
		assertRecorded(this.aggregate, eventClass, ...expected);
		return this;
	}

	public thenRecordedNothing(): this {
		assertRecordedNothing(this.aggregate);
		return this;
	}
}
