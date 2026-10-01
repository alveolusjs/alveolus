import { DomainError } from "../../src/domain/domain-errors/index.ts";

export class OrderAlreadyPlaced extends DomainError {}

export class InvalidTotal extends DomainError<{ total: number }> {}
