import { describe, expect, it } from "vitest";

import type { Result } from "./result.ts";
import { andThen, combine, err, map, mapErr, ok } from "./result.ts";

const parse = (raw: string): Result<number, string> => {
	const value = Number(raw);
	return Number.isNaN(value) ? err(`not a number: ${raw}`) : ok(value);
};

describe("Result", () => {
	it("builds a success", () => {
		expect(ok(42)).toEqual({ ok: true, value: 42 });
	});

	it("builds a success without value", () => {
		const result: Result<void, never> = ok();

		expect(result).toEqual({ ok: true, value: undefined });
	});

	it("builds a failure", () => {
		expect(err("boom")).toEqual({ error: "boom", ok: false });
	});

	it("narrows on ok", () => {
		const result = parse("42");

		expect(result.ok ? result.value + 1 : result.error).toBe(43);
	});

	it("maps a success and leaves a failure untouched", () => {
		expect(map(parse("2"), (value) => value * 2)).toEqual(ok(4));
		expect(map(parse("x"), (value) => value * 2)).toEqual(err("not a number: x"));
	});

	it("maps a failure and leaves a success untouched", () => {
		expect(mapErr(parse("x"), (error) => error.length)).toEqual(err(15));
		expect(mapErr(parse("2"), (error) => error.length)).toEqual(ok(2));
	});

	it("chains results and stops at the first failure", () => {
		const positive = (value: number): Result<number, "negative"> => (value < 0 ? err("negative") : ok(value));

		expect(andThen(parse("3"), positive)).toEqual(ok(3));
		expect(andThen(parse("-3"), positive)).toEqual(err("negative"));
		expect(andThen(parse("x"), positive)).toEqual(err("not a number: x"));
	});

	it("combines a tuple of successes into a tuple of values", () => {
		const result = combine([parse("1"), ok("a")]);

		expect(result).toEqual(ok([1, "a"]));
		if (result.ok) {
			const [count, label]: [number, string] = result.value;
			expect(count + label.length).toBe(2);
		}
	});

	it("combines a record of successes into a record of values", () => {
		const result = combine({ count: parse("1"), label: ok("a") });

		expect(result).toEqual(ok({ count: 1, label: "a" }));
		if (result.ok) {
			const { count, label }: { count: number; label: string } = result.value;
			expect(count + label.length).toBe(2);
		}
	});

	it("returns the first failure", () => {
		const negative: Result<number, "negative"> = err("negative");

		const result = combine([parse("1"), negative, parse("x")]);

		expect(result).toEqual(err("negative"));
		if (!result.ok) {
			const error: string = result.error;
			// @ts-expect-error
			const narrow: "negative" = result.error;
			expect(error).toBe(narrow);
		}
	});

	it("unions the errors of a record", () => {
		const negative: Result<number, "negative"> = err("negative");

		const result = combine({ count: negative, other: ok(1) });

		if (!result.ok) {
			const error: "negative" = result.error;
			expect(error).toBe("negative");
		}
	});

	it("combines nothing into an empty success", () => {
		expect(combine([])).toEqual(ok([]));
		expect(combine({})).toEqual(ok({}));
	});
});
