import { DomainEvent } from "@alveolus/core";

import type { FixtureId } from "./value-objects/ids.identifier.ts";

export class ParcelLost extends DomainEvent<FixtureId, null> {}
