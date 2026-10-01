import type { AnyIdentifier } from "../value-objects/index.ts";
import type { AnySnapshot } from "./snapshot.ts";

export abstract class Entity<Id extends AnyIdentifier, Snapshot extends AnySnapshot = AnySnapshot> {
	public readonly id: Id;

	protected constructor(id: Id) {
		this.id = id;
	}

	public equals(other: AnyEntity): boolean {
		return other === this || (other.constructor === this.constructor && this.id.equals(other.id));
	}

	public abstract toSnapshot(): Snapshot;
}

export type AnyEntity = Entity<AnyIdentifier>;
