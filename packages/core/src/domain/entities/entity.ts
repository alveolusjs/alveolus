import type { AnyIdentifier } from '../value-objects/index.ts';

export abstract class Entity<Id extends AnyIdentifier> {
	public readonly id: Id;

	protected constructor(id: Id) {
		this.id = id;
	}

	public equals(other: AnyEntity): boolean {
		return other === this || (other.constructor === this.constructor && this.id.equals(other.id));
	}
}

export type AnyEntity = Entity<AnyIdentifier>;
