import { DomainError } from "@alveolus/core";

export class TooManyParcels extends DomainError {}

export class ParcelExpired extends DomainError {}
