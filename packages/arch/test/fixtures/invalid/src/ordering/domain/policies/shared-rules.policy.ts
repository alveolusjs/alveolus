import { err, ok, Policy } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { ParcelExpired } from "../errors/parcel.error.ts";

export class ExpiryPolicy extends Policy<Date, ParcelExpired> {
	public check(shippedAt: Date): Result<void, ParcelExpired> {
		return shippedAt.getTime() < new Date().getTime() ? err(new ParcelExpired()) : ok();
	}

	public async refresh(): Promise<void> {}
}
