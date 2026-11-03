import { z } from 'zod';

const env = z
	.object({
		SMTP_URL: z.url(),
		RECEIPTS_FROM: z.email(),
		NOTIFICATIONS_SEND_INTERVAL_MS: z.coerce.number().int().positive(),
	})
	.parse(process.env);

export const notificationsConfig = {
	smtpUrl: env.SMTP_URL,
	from: env.RECEIPTS_FROM,
	sendIntervalMs: env.NOTIFICATIONS_SEND_INTERVAL_MS,
} as const;
