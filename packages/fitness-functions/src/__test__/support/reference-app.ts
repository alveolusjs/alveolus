export const referenceApp: Readonly<Record<string, string>> = {
	'tsconfig.json': `{
	"compilerOptions": {
		"module": "nodenext",
		"paths": { "@wallets/*": ["./src/wallets/*"] }
	}
}
`,
	'src/main.ts': `import { NotificationsModule } from './notifications/notifications.module.ts';
import { WalletsModule } from './wallets/wallets.module.ts';

export const modules = [WalletsModule, NotificationsModule];
`,
	'src/shared/money.ts': `export class Money {
	public constructor(public readonly cents: number) {}
}
`,
	'src/wallets/wallets.module.ts': `import { Deposit } from './application/deposit.command.ts';

export class WalletsModule {
	public readonly providers = [Deposit];
}
`,
	'src/wallets/domain/wallet.aggregate.ts': `import { Money } from '../../shared/money.ts';

export class Wallet {
	private balance: Money = new Money(0);

	public deposit(amount: Money): void {
		this.balance = new Money(this.balance.cents + amount.cents);
	}
}
`,
	'src/wallets/application/deposit.command.ts': `import type { Money } from '../../shared/money.ts';
import type { Wallet } from '../domain/wallet.aggregate.ts';

export class Deposit {
	public run(wallet: Wallet, amount: Money): void {
		wallet.deposit(amount);
	}
}
`,
	'src/wallets/public/wallet-contract.ts': `export interface WalletContract {
	readonly id: string;
}
`,
	'src/notifications/notifications.module.ts': `import { NotifyHolder } from './application/notify-holder.command.ts';

export class NotificationsModule {
	public readonly providers = [NotifyHolder];
}
`,
	'src/notifications/domain/notification.aggregate.ts': `export class Notification {
	public constructor(public readonly walletId: string) {}
}
`,
	'src/notifications/application/notify-holder.command.ts': `import type { WalletContract } from '@wallets/public/wallet-contract.ts';
import { Notification } from '../domain/notification.aggregate.ts';

export class NotifyHolder {
	public run(wallet: WalletContract): Notification {
		return new Notification(wallet.id);
	}
}
`,
	'src/notifications/driving/deposit-made.consumer.ts': `import type { WalletContract } from '../../wallets/public/wallet-contract.ts';
import type { NotifyHolder } from '../application/notify-holder.command.ts';

export class DepositMadeConsumer {
	public constructor(private readonly notifyHolder: NotifyHolder) {}

	public consume(wallet: WalletContract): void {
		this.notifyHolder.run(wallet);
	}
}
`,
};
