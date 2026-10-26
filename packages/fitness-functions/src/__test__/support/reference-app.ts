export const referenceApp: Readonly<Record<string, string>> = {
	'architecture.json': `{
	"contexts": {
		"wallets": "tactical",
		"notifications": "transaction-script"
	}
}
`,
	'package.json': `{
	"name": "reference-app",
	"type": "module"
}
`,
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
	'src/notifications/notifications.module.ts': `import { NotificationService } from './application/notification.service.ts';

export class NotificationsModule {
	public readonly providers = [NotificationService];
}
`,
	'src/notifications/application/notification.service.ts': `import type { WalletContract } from '@wallets/public/wallet-contract.ts';

export class NotificationService {
	public notifyHolder(wallet: WalletContract): string {
		return wallet.id;
	}
}
`,
	'src/notifications/driving/deposit-made.consumer.ts': `import type { WalletContract } from '../../wallets/public/wallet-contract.ts';
import type { NotificationService } from '../application/notification.service.ts';

export class DepositMadeConsumer {
	public constructor(private readonly notifications: NotificationService) {}

	public consume(wallet: WalletContract): void {
		this.notifications.notifyHolder(wallet);
	}
}
`,
};
