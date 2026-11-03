import { DomainError } from '@alveolus/core';

export class InvalidEmail extends DomainError<{ readonly email: string }> {}

export class NotificationNotPending extends DomainError<{ readonly notificationId: string }> {}

export class NoEmailAddress extends DomainError<{ readonly customerId: string }> {}
