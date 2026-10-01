import { DomainEvent } from "@alveolus/core";

import type { OrderId } from "../value-objects/ids.identifier.ts";

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}
