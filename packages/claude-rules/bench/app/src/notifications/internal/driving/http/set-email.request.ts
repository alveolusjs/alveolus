import { z } from 'zod';

export const SetEmailRequest = z
	.object({
		email: z.email().meta({ example: 'alice@example.com' }),
	})
	.meta({ id: 'SetEmail' });

export type SetEmailRequest = z.output<typeof SetEmailRequest>;

export const CustomerIdParam = z.uuid();
