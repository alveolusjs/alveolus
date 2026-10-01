import { DomainEvent } from "@alveolus/core";

import type { OrderId } from "../value-objects/order-id.identifier.ts";

export class OrderPlaced extends DomainEvent<OrderId, { customerId: string; total: number; currency: string }> {}
