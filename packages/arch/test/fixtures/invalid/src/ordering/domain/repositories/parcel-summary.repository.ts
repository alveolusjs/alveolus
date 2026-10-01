import type { ViewRepository } from "@alveolus/core";

import type { ParcelSummary } from "../parcel-summary.ts";

export interface ParcelSummaryRepository extends ViewRepository<ParcelSummary> {
	findById(parcelId: string): Promise<ParcelSummary | undefined>;
}
