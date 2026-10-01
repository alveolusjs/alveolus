import { DomainService } from "@alveolus/core";

import type { FixtureId } from "../value-objects/ids.identifier.ts";

interface ParcelRepository {
	exists(id: FixtureId): Promise<boolean>;
}

export class RoutingService extends DomainService {
	private readonly parcels: ParcelRepository;

	public constructor(parcels: ParcelRepository) {
		super();
		this.parcels = parcels;
	}

	public isLate(due: Date): boolean {
		return due.getTime() < Date.now();
	}

	public async route(id: FixtureId): Promise<boolean> {
		return this.parcels.exists(id);
	}
}
