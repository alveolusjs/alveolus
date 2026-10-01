import { DomainError } from "../../src/domain/domain-errors/index.ts";
import { Policy } from "../../src/domain/policies/index.ts";
import type { Result } from "../../src/utilities/result/index.ts";
import { err, ok } from "../../src/utilities/result/index.ts";

export class VoyageOverbooked extends DomainError<{ capacity: number }> {}

export interface Booking {
	readonly booked: number;
	readonly size: number;
}

export class OverbookingPolicy extends Policy<Booking, VoyageOverbooked> {
	private readonly capacity: number;

	public constructor(capacity: number) {
		super();
		this.capacity = capacity;
	}

	public check({ booked, size }: Booking): Result<void, VoyageOverbooked> {
		if (booked + size > this.capacity * 1.1) {
			return err(new VoyageOverbooked({ capacity: this.capacity }));
		}
		return ok();
	}
}

export class UnlimitedPolicy extends Policy<Booking, VoyageOverbooked> {
	public check(): Result<void, VoyageOverbooked> {
		return ok();
	}
}

export class BooleanPolicy extends Policy<Booking> {
	// @ts-expect-error
	public check(): boolean {
		return true;
	}
}
