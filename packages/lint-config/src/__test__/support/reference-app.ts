export const referenceApp: Readonly<Record<string, string>> = {
	'package.json': `{
	"name": "reference-app",
	"private": true
}
`,
	'tsconfig.json': `{
	"compilerOptions": {
		"module": "nodenext",
		"strict": true,
		"experimentalDecorators": true,
		"allowImportingTsExtensions": true,
		"noEmit": true,
		"paths": { "@wallets/*": ["./src/wallets/*"] }
	},
	"include": ["src"]
}
`,
	'src/main.bootstrap.ts': `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.ts';

export const app = NestFactory.create(AppModule);
`,
	'src/app.module.ts': `import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module.ts';
import { SharedModule } from './shared/shared.module.ts';
import { WalletsModule } from './wallets/wallets.module.ts';

@Module({ imports: [SharedModule, WalletsModule, NotificationsModule] })
export class AppModule {}
`,
	'src/shared/shared.module.ts': `import { Module } from '@nestjs/common';
import { PrismaUnitOfWork } from './driven/prisma/prisma.unit-of-work.ts';

@Module({ providers: [PrismaUnitOfWork], exports: [PrismaUnitOfWork] })
export class SharedModule {}
`,
	'src/shared/driven/prisma/prisma.unit-of-work.ts': `import { PrismaClient } from '@prisma/client';

export class PrismaUnitOfWork {
	public readonly client = new PrismaClient();
}
`,
	'src/wallets/wallets.module.ts': `import { Module } from '@nestjs/common';
import { DepositHandler } from './application/wallet/deposit.command.ts';
import { PrismaWalletRepository } from './driven/prisma/prisma-wallet.repository.ts';

@Module({ providers: [DepositHandler, PrismaWalletRepository] })
export class WalletsModule {}
`,
	'src/wallets/domain/holder/holder.id.ts': `import { Identifier } from '@alveolus/core';

export class HolderId extends Identifier {}
`,
	'src/wallets/domain/wallet/wallet.aggregate.ts': `import { AggregateRoot } from '@alveolus/core';
import type { HolderId } from '../holder/holder.id.ts';

export class Wallet extends AggregateRoot {
	public readonly holder?: HolderId;
}
`,
	'src/wallets/domain/wallet/wallet.repository.ts': `import type { Wallet } from './wallet.aggregate.ts';

export abstract class WalletRepository {
	public abstract save(wallet: Wallet): Promise<void>;
}
`,
	'src/wallets/domain/wallet/__test__/wallet.aggregate.spec.ts': `import { expect, it } from 'vitest';
import { PrismaWalletRepository } from '../../../driven/prisma/prisma-wallet.repository.ts';

it('opens a wallet', () => {
	expect(PrismaWalletRepository).toBeDefined();
});
`,
	'src/wallets/application/wallet/deposit.command.ts': `import type { WalletRepository } from '../../domain/wallet/wallet.repository.ts';

export class DepositHandler {
	readonly #wallets: WalletRepository;

	public constructor(wallets: WalletRepository) {
		this.#wallets = wallets;
	}
}
`,
	'src/wallets/driven/prisma/prisma-wallet.repository.ts': `import { PrismaClient } from '@prisma/client';
import type { Wallet } from '../../domain/wallet/wallet.aggregate.ts';
import { WalletRepository } from '../../domain/wallet/wallet.repository.ts';

export class PrismaWalletRepository extends WalletRepository {
	readonly #client = new PrismaClient();

	public async save(wallet: Wallet): Promise<void> {
		await this.#client.wallet.update({ where: { id: wallet.id } });
	}
}
`,
	'src/wallets/driving/http/wallet.controller.ts': `import { Controller, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DepositHandler } from '../../application/wallet/deposit.command.ts';

@ApiTags('wallets')
@Controller('wallets')
export class WalletController {
	readonly #deposit: DepositHandler;

	public constructor(@Inject(DepositHandler) deposit: DepositHandler) {
		this.#deposit = deposit;
	}
}
`,
	'src/wallets/driving/in-process/wallets-facade.adapter.ts': `import type { DepositHandler } from '../../application/wallet/deposit.command.ts';
import { WalletsFacade } from '../../public/wallets.facade.ts';

export class WalletsFacadeAdapter extends WalletsFacade {
	readonly #deposit: DepositHandler;

	public constructor(deposit: DepositHandler) {
		super();
		this.#deposit = deposit;
	}
}
`,
	'src/wallets/public/wallets.facade.ts': `import type { WalletDto } from './wallet.dto.ts';

export abstract class WalletsFacade {
	public balanceOf?(id: string): Promise<WalletDto>;
}
`,
	'src/wallets/public/wallet.dto.ts': `export type WalletDto = {
	readonly id: string;
	readonly balance: number;
};
`,
	'src/notifications/notifications.module.ts': `import { Module } from '@nestjs/common';
import { NotificationService } from './application/notification/notification.service.ts';

@Module({ providers: [NotificationService] })
export class NotificationsModule {}
`,
	'src/notifications/application/notification/notification.service.ts': `import { PrismaClient } from '@prisma/client';
import type { WalletsFacade } from '@wallets/public/wallets.facade.ts';

export class NotificationService {
	readonly #client = new PrismaClient();
	readonly #wallets: WalletsFacade;

	public constructor(wallets: WalletsFacade) {
		this.#wallets = wallets;
	}
}
`,
};
