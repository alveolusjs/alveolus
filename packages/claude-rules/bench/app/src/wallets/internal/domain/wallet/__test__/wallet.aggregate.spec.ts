import { describe, expect, it } from 'vitest';

import { WalletFixtures } from './wallet.fixtures';

const { at, dollars, euros, walletWith } = WalletFixtures;

describe('a withdrawal takes money out of an open wallet', () => {
	it('lowers the balance by the amount and records the withdrawal', () => {
		const wallet = walletWith(euros(5_000n));

		const withdrawn = wallet.withdraw(euros(2_000n), at);

		expect(withdrawn.ok).toBe(true);
		expect(wallet.toSnapshot().balance).toBe(3_000n);
		expect(wallet.pullDomainEvents().map((event) => event.type)).toEqual(['MoneyWithdrawn']);
	});

	it('refuses a closed wallet', () => {
		const wallet = walletWith(euros(0n), 'closed');

		const withdrawn = wallet.withdraw(euros(100n), at);

		expect(withdrawn.ok ? undefined : withdrawn.error.type).toBe('WalletIsClosed');
	});

	it('refuses a zero amount', () => {
		const wallet = walletWith(euros(5_000n));

		const withdrawn = wallet.withdraw(euros(0n), at);

		expect(withdrawn.ok ? undefined : withdrawn.error.type).toBe('AmountNotPositive');
	});

	it('refuses an amount in another currency', () => {
		const wallet = walletWith(euros(5_000n));

		const withdrawn = wallet.withdraw(dollars(100n), at);

		expect(withdrawn.ok ? undefined : withdrawn.error.type).toBe('CurrencyMismatch');
	});
});

describe('a balance never goes below zero', () => {
	it('refuses a withdrawal larger than the balance', () => {
		const wallet = walletWith(euros(1_000n));

		const withdrawn = wallet.withdraw(euros(1_500n), at);

		expect(withdrawn.ok ? undefined : withdrawn.error.type).toBe('InsufficientFunds');
	});
});

describe('only an empty wallet closes', () => {
	it('refuses to close a wallet with money left', () => {
		const wallet = walletWith(euros(100n));

		const closed = wallet.close(at);

		expect(closed.ok ? undefined : closed.error.type).toBe('BalanceNotZero');
	});

	it('closes a wallet with a zero balance', () => {
		const wallet = walletWith(euros(0n));

		const closed = wallet.close(at);

		expect(closed.ok).toBe(true);
		expect(wallet.toSnapshot().status).toBe('closed');
	});
});
