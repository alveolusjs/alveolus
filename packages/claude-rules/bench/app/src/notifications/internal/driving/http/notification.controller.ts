import { Body, Controller, HttpCode, Inject, Param, Put } from '@nestjs/common';

import { ResultController } from '../../../../shared/driving/http/result.controller';
import { NotificationService } from '../../application/notification.service';
import { CustomerIdParam, SetEmailRequest } from './set-email.request';

@Controller('customers')
export class NotificationController extends ResultController {
	protected readonly statuses = { InvalidEmail: 400 };

	readonly #notifications: NotificationService;

	constructor(@Inject(NotificationService) notifications: NotificationService) {
		super();
		this.#notifications = notifications;
	}

	@Put(':customerId/email')
	@HttpCode(204)
	async setEmail(
		@Param('customerId', { schema: CustomerIdParam }) customerId: string,
		@Body({ schema: SetEmailRequest }) body: SetEmailRequest,
	): Promise<void> {
		const set = await this.#notifications.setEmail(customerId, body.email);

		this.orHttpError(set);
	}
}
