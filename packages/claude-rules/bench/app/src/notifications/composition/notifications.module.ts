import { Clock, IdGenerator } from '@alveolus/core';
import { Module } from '@nestjs/common';

import { Wiring } from '../../shared/composition/shared.composition';
import { PrismaUnitOfWork } from '../../shared/driven/prisma/prisma-unit-of-work.adapter';
import { IntegrationConsumer } from '../../shared/driving/in-process/integration.consumer';
import { EmailSender } from '../internal/application/email-sender.port';
import { NotificationService } from '../internal/application/notification.service';
import { SmtpEmailSender } from '../internal/driven/smtp/smtp-email-sender.adapter';
import { NotificationController } from '../internal/driving/http/notification.controller';
import { MoneyWithdrawnConsumer } from '../internal/driving/in-process/money-withdrawn.consumer';
import { PendingNotificationsScheduler } from '../internal/driving/in-process/pending-notifications.scheduler';
import { notificationsConfig } from './notifications.config';

@Module({
	controllers: [NotificationController],
	providers: [
		{
			provide: EmailSender,
			useFactory: () => new SmtpEmailSender(notificationsConfig.smtpUrl, notificationsConfig.from),
		},
		Wiring.construct(NotificationService, [PrismaUnitOfWork, EmailSender, IdGenerator, Clock]),
		Wiring.construct(MoneyWithdrawnConsumer, [IntegrationConsumer, NotificationService]),
		{
			provide: PendingNotificationsScheduler,
			useFactory: (notifications: NotificationService) =>
				new PendingNotificationsScheduler(notifications, notificationsConfig.sendIntervalMs),
			inject: [NotificationService],
		},
	],
})
export class NotificationsModule {}
