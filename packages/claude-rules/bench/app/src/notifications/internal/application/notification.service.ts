import { type Clock, err, type IdGenerator, ok, type Result } from '@alveolus/core';

import type { PrismaUnitOfWork } from '../../../shared/driven/prisma/prisma-unit-of-work.adapter';
import type { EmailSender } from './email-sender.port';
import { type InvalidEmail, NoEmailAddress, NotificationNotPending } from './notification.errors';

export type WithdrawalReceipt = {
	readonly customerId: string;
	readonly amount: { readonly minor: string; readonly currency: string };
	readonly balance: { readonly minor: string; readonly currency: string };
};

export class NotificationService {
	readonly #unitOfWork: PrismaUnitOfWork;
	readonly #emails: EmailSender;
	readonly #ids: IdGenerator;
	readonly #clock: Clock;

	// constructor(unitOfWork, emails, ids, clock)

	async setEmail(customerId: string, email: string): Promise<Result<void, InvalidEmail>> {
		// the address must look valid, then the customer's notification channel is upserted, in one transaction
	}

	async recordWithdrawalReceipt(withdrawal: WithdrawalReceipt): Promise<Result<void, never>> {
		return this.#unitOfWork.run(async () => {
			await this.#unitOfWork.client().notification.create({
				data: {
					id: this.#ids.next(),
					customerId: withdrawal.customerId,
					kind: 'withdrawal_receipt',
					amount: BigInt(withdrawal.amount.minor),
					balance: BigInt(withdrawal.balance.minor),
					currency: withdrawal.amount.currency,
					status: 'pending',
					createdAt: this.#clock.now(),
				},
			});

			return ok();
		});
	}

	// listPending(limit): the ids of the oldest pending notifications, read outside any transaction

	async send(notificationId: string): Promise<Result<void, NotificationNotPending | NoEmailAddress>> {
		const db = this.#unitOfWork.client();
		const notification = await db.notification.findUnique({ where: { id: notificationId } });

		if (!notification || notification.status !== 'pending') {
			return err(new NotificationNotPending({ notificationId }));
		}

		const channel = await db.notificationChannel.findUnique({ where: { customerId: notification.customerId } });

		if (!channel) {
			return err(new NoEmailAddress({ customerId: notification.customerId }));
		}

		const { kind, currency, amount, balance } = notification;
		await this.#emails.sendReceipt({ to: channel.email, kind, currency, amount, balance });

		return this.#unitOfWork.run(async () => {
			await this.#unitOfWork.client().notification.updateMany({
				where: { id: notification.id, status: 'pending' },
				data: { status: 'sent', sentAt: this.#clock.now() },
			});

			return ok();
		});
	}
}
