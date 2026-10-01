import { DomainError } from "@alveolus/core";

export class InvalidCurrency extends DomainError<{ currency: string }> {}
