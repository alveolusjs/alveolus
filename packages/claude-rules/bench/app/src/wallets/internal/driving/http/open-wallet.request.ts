import { z } from 'zod';

export const OpenWalletRequest = z
	.object({
		customerId: z.uuid().meta({ example: '0190f5a2-8a4b-7c2d-8e1f-3a5b7c9d1e2f' }),
		currency: z.string().length(3).meta({ example: 'EUR' }),
	})
	.meta({ id: 'OpenWallet' });

export type OpenWalletRequest = z.output<typeof OpenWalletRequest>;
