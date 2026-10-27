import { Entity } from '../../src/domain/entities/index.ts';
import { Identifier } from '../../src/domain/value-objects/index.ts';

export class UserId extends Identifier<number, 'UserId'> {}

export class User extends Entity<UserId> {
	public constructor(
		id: UserId,
		public readonly name: string,
	) {
		super(id);
	}
}

export class Admin extends Entity<UserId> {
	public constructor(id: UserId) {
		super(id);
	}
}
