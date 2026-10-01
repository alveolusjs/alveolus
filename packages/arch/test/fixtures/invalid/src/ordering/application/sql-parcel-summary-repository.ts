import type { ParcelSummary } from "../domain/parcel-summary.ts";
import type { ParcelSummaryRepository } from "../domain/repositories/parcel-summary.repository.ts";

export class SqlParcelSummaryRepository implements ParcelSummaryRepository {
	public findById(parcelId: string): Promise<ParcelSummary | undefined> {
		return Promise.resolve({ id: parcelId });
	}
}
