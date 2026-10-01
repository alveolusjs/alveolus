import { describe, expect, it } from "vitest";

import { Admin, User, UserId } from "../../../test/fixtures/entity.ts";

describe("Entity", () => {
	it("is equal to an entity of the same class with an equal identifier", () => {
		expect(new User(new UserId(1), "Ada").equals(new User(new UserId(1), "Grace"))).toBe(true);
	});

	it("is not equal to an entity with another identifier", () => {
		expect(new User(new UserId(1), "Ada").equals(new User(new UserId(2), "Ada"))).toBe(false);
	});

	it("is not equal to an entity of another class", () => {
		expect(new User(new UserId(1), "Ada").equals(new Admin(new UserId(1)))).toBe(false);
	});
});
