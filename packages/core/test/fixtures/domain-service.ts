import { DomainError } from "../../src/domain/domain-errors/index.ts";
import { DomainService } from "../../src/domain/domain-services/index.ts";
import type { Result } from "../../src/utilities/result/index.ts";
import { err, ok } from "../../src/utilities/result/index.ts";

export class InvalidWeight extends DomainError<{ weight: number }> {}

export class ShippingCost extends DomainService {
	public constructor(private readonly fee: number) {
		super();
	}

	public costOf(weight: number): Result<number, InvalidWeight> {
		if (weight <= 0) {
			return err(new InvalidWeight({ weight }));
		}
		return ok(weight > 2 ? this.fee * 2 : this.fee);
	}
}
