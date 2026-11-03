import { DomainError } from '@alveolus/core';

export class InvalidMoney extends DomainError<{ readonly minor: bigint }> {}

export class UnsupportedCurrency extends DomainError<{ readonly code: string }> {}

export class CurrencyMismatch extends DomainError<{ readonly expected: string; readonly actual: string }> {}
