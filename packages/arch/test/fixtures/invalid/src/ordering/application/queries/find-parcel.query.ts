import { ok } from "@alveolus/core";
import type { QueryHandler, Result } from "@alveolus/core";

import type { FindParcel } from "./find-parcel-input.ts";

export class FindParcelHandler implements QueryHandler<FindParcel, string> {
	public async handle({ parcelId }: FindParcel): Promise<Result<string, never>> {
		return ok(parcelId);
	}
}
