import { DomainEvent } from "@alveolus/core";

import type { FixtureId } from "../value-objects/ids.identifier.ts";

export class LineShipped extends DomainEvent<FixtureId, null> {}
