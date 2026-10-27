import { DomainError } from './domain-error.ts';

export class InvalidIdentifier extends DomainError<{ identifier: string; value: string }> {}
