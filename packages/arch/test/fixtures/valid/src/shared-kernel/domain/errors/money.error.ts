import { DomainError } from "@alveolus/core";

export class InvalidAmount extends DomainError<{ amount: number }> {}

export class InvalidCurrency extends DomainError<{ code: string }> {}
