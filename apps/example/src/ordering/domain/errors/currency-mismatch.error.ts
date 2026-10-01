import { DomainError } from "@alveolus/core";

export class CurrencyMismatch extends DomainError<{ expected: string; actual: string }> {}
