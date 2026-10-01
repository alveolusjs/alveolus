import { describe, expect, it } from "vitest";

import { Admin, User, UserId } from "../../../test/fixtures/entity.ts";
import type { Entity } from "./entity.ts";

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

	it("turns into a snapshot of plain data and back", () => {
		const user = new User(new UserId(1), "Ada", new Date("2026-02-01T00:00:00Z"));
		const restored = User.fromSnapshot(user.toSnapshot());

		expect(user.toSnapshot()).toEqual({ id: 1, joinedAt: new Date("2026-02-01T00:00:00Z"), name: "Ada" });
		expect(restored.equals(user)).toBe(true);
		expect(restored.toSnapshot()).toEqual(user.toSnapshot());
	});

	it("only accepts plain data as snapshot", () => {
		// @ts-expect-error
		const withIdentifier: Entity<UserId, { id: UserId }> | undefined = undefined;
		const withBigint: Entity<UserId, { id: bigint; tags: readonly string[]; at: Date | null }> | undefined = undefined;

		expect([withIdentifier, withBigint]).toEqual([undefined, undefined]);
	});
});
