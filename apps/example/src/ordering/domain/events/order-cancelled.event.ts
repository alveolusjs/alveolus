import { DomainEvent } from "@alveolus/core";

import type { OrderId } from "../value-objects/order-id.identifier.ts";

export class OrderCancelled extends DomainEvent<OrderId, { reason: string }> {}
