import { DomainError } from "@alveolus/core";

export class InvalidQuantity extends DomainError<{ quantity: number }> {}
