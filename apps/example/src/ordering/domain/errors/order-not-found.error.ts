import { DomainError } from "@alveolus/core";

export class OrderNotFound extends DomainError<{ orderId: string }> {}
