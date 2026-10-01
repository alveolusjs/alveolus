import { describe, expect, it } from "vitest";

import { Contact, Email, InvalidEmail, Username } from "../../../test/fixtures/value-object.ts";
import { err } from "../../utilities/result/index.ts";

const email = (raw: string): Email => {
	const result = Email.create(raw);
	if (!result.ok) {
		throw new Error(raw);
	}
	return result.value;
};

const contact = (overrides: Partial<{ email: Email; tags: string[]; since: Date; city: string }> = {}): Contact =>
	new Contact({
		address: { city: overrides.city ?? "Lyon" },
		email: overrides.email ?? email("jane@example.com"),
		since: overrides.since ?? new Date("2026-01-01T00:00:00Z"),
		tags: overrides.tags ?? ["vip"],
	});

describe("ValueObject", () => {
	it("is created through a factory returning a Result", () => {
		expect(email("JANE@example.com").value).toBe("jane@example.com");
		expect(Email.create("nope")).toEqual(err(new InvalidEmail({ raw: "nope" })));
	});

	it("is equal to a value object of the same class with equal props", () => {
		expect(email("jane@example.com").equals(email("JANE@example.com"))).toBe(true);
		expect(email("jane@example.com").equals(email("john@example.com"))).toBe(false);
	});

	it("is not equal to a value object of another class with the same props", () => {
		expect(email("jane@example.com").equals(new Username("jane@example.com"))).toBe(false);
	});

	it("compares nested value objects, arrays, dates and plain objects deeply", () => {
		expect(contact().equals(contact())).toBe(true);
		expect(contact().equals(contact({ email: email("john@example.com") }))).toBe(false);
		expect(contact().equals(contact({ tags: ["vip", "new"] }))).toBe(false);
		expect(contact().equals(contact({ since: new Date("2026-02-01T00:00:00Z") }))).toBe(false);
		expect(contact().equals(contact({ city: "Paris" }))).toBe(false);
	});

	it("freezes its props and keeps its own copy", () => {
		const props = { value: "jane" };
		const username = new Username(props.value);

		expect(Object.isFrozen((username as unknown as { props: object }).props)).toBe(true);
		expect(() => {
			(username as unknown as { props: { value: string } }).props.value = "john";
		}).toThrow(TypeError);
	});
});
