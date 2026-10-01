import { ok, Policy } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import type { TooManyParcels } from "../domain/errors/parcel.error.ts";

export class RefundPolicy extends Policy<number, TooManyParcels> {
	public check(): Result<void, TooManyParcels> {
		return ok();
	}
}
