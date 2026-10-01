import { DomainEvent } from "../../src/domain/domain-events/index.ts";
import { Identifier } from "../../src/domain/value-objects/index.ts";

export class OrderId extends Identifier<string, "OrderId"> {}

export class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}

export class OrderShipped extends DomainEvent<OrderId, null> {}
