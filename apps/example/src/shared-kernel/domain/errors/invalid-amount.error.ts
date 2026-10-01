import { DomainError } from "@alveolus/core";

export class InvalidAmount extends DomainError<{ amount: number }> {}
