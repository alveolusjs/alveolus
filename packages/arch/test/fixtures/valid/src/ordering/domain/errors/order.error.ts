import { DomainError } from "@alveolus/core";

export class OrderAlreadyPlaced extends DomainError {}

export class InvalidQuantity extends DomainError<{ quantity: number }> {}

export class OrderNotFound extends DomainError {}
