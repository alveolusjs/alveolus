import { DomainError } from "@alveolus/core";

export class OrderNotDraft extends DomainError<{ status: string }> {}
