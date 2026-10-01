import { Entity, Identifier } from "../../src/domain/entities/index.ts";

export class UserId extends Identifier<number, "UserId"> {}

export type UserSnapshot = { id: number; name: string };

export class User extends Entity<UserId, UserSnapshot> {
	public constructor(
		id: UserId,
		public readonly name: string,
	) {
		super(id);
	}

	public toSnapshot(): UserSnapshot {
		return { id: this.id.value, name: this.name };
	}
}

export class Admin extends Entity<UserId, { id: number }> {
	public constructor(id: UserId) {
		super(id);
	}

	public toSnapshot(): { id: number } {
		return { id: this.id.value };
	}
}
