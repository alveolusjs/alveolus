import { DomainEvent } from "@alveolus/core";

import type { FixtureId } from "../value-objects/ids.identifier.ts";

export class ShipParcel extends DomainEvent<FixtureId, null> {}

export class ParcelDeliveredEvent extends DomainEvent<FixtureId, null> {}

export class ParcelSpeed extends DomainEvent<FixtureId, null> {}

export class ParcelSent extends DomainEvent<FixtureId, null> {}

export class ParcelReturned extends DomainEvent<FixtureId, null> {}
