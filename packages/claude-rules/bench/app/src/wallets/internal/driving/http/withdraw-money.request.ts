import { z } from 'zod';

export const WithdrawMoneyRequest = z
	.object({
		amount: z.object({
			minor: z
				.string()
				.regex(/^\d+$/)
				.transform((minor) => BigInt(minor))
				.meta({ example: '2500' }),
			currency: z.string().length(3).meta({ example: 'EUR' }),
		}),
	})
	.meta({ id: 'WithdrawMoney' });

export type WithdrawMoneyRequest = z.output<typeof WithdrawMoneyRequest>;
