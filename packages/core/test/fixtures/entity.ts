import { Entity } from '../../src/domain/entities/index.ts';
import { Identifier } from '../../src/domain/value-objects/index.ts';

export class UserId extends Identifier<number, 'UserId'> {}

export class User extends Entity<UserId> {
	public readonly name: string;

	public constructor(id: UserId, name: string) {
		super(id);
		this.name = name;
	}
}

export class Admin extends Entity<UserId> {
	public constructor(id: UserId) {
		super(id);
	}
}
