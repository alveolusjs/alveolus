import type { ViewRepository } from "@alveolus/core";

import type { ParcelTracking } from "../domain/views/parcel-tracking.view.ts";

export interface ParcelTrackingRepository extends ViewRepository<ParcelTracking> {
	findById(parcelId: string): Promise<ParcelTracking | undefined>;
}
