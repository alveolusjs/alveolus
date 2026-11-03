import { Clock, DomainEventDispatcher, IdGenerator, UnitOfWork } from '@alveolus/core';
import { Module } from '@nestjs/common';

import { Wiring } from '../../shared/composition/shared.composition';
import { PrismaUnitOfWork } from '../../shared/driven/prisma/prisma-unit-of-work.adapter';
import { CloseWalletHandler } from '../internal/application/wallet/close-wallet.command';
import { OpenWalletHandler } from '../internal/application/wallet/open-wallet.command';
import { WithdrawMoneyHandler } from '../internal/application/wallet/withdraw-money.command';
import { WalletRepository } from '../internal/domain/wallet/wallet.repository';
import { PrismaWalletRepository } from '../internal/driven/prisma/prisma-wallet.repository';
import { WalletController } from '../internal/driving/http/wallet.controller';
import { eventHandlerProviders } from './event-handlers.composition';

@Module({
	controllers: [WalletController],
	providers: [
		{ ...Wiring.construct(PrismaWalletRepository, [PrismaUnitOfWork, IdGenerator]), provide: WalletRepository },
		...eventHandlerProviders,
		Wiring.construct(OpenWalletHandler, [UnitOfWork, WalletRepository, DomainEventDispatcher, Clock]),
		Wiring.construct(WithdrawMoneyHandler, [UnitOfWork, WalletRepository, DomainEventDispatcher, Clock]),
		Wiring.construct(CloseWalletHandler, [UnitOfWork, WalletRepository, DomainEventDispatcher, Clock]),
	],
})
export class WalletsModule {}
