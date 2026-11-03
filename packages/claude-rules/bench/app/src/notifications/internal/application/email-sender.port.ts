import { Port } from '@alveolus/core';

export type ReceiptEmail = {
	readonly to: string;
	readonly kind: 'withdrawal_receipt';
	readonly currency: string;
	readonly amount: bigint;
	readonly balance: bigint;
};

export abstract class EmailSender extends Port {
	abstract sendReceipt(email: ReceiptEmail): Promise<void>;
}
