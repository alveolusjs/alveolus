import { Entity } from "../../src/domain/entities/index.ts";
import { Identifier } from "../../src/domain/value-objects/index.ts";

export class UserId extends Identifier<number, "UserId"> {}

export type UserSnapshot = { id: number; name: string; joinedAt: Date };

export class User extends Entity<UserId, UserSnapshot> {
	public constructor(
		id: UserId,
		public readonly name: string,
		private readonly joinedAt: Date = new Date("2026-01-01T00:00:00Z"),
	) {
		super(id);
	}

	public static fromSnapshot(snapshot: UserSnapshot): User {
		return new User(new UserId(snapshot.id), snapshot.name, snapshot.joinedAt);
	}

	public toSnapshot(): UserSnapshot {
		return { id: this.id.value, joinedAt: this.joinedAt, name: this.name };
	}
}

export class Admin extends Entity<UserId> {
	public constructor(id: UserId) {
		super(id);
	}

	public toSnapshot(): { id: number } {
		return { id: this.id.value };
	}
}
