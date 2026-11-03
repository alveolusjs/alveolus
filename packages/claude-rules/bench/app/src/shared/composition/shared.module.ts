import { Clock, CorrelationContext, IdGenerator, Outbox, UnitOfWork } from '@alveolus/core';
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaUnitOfWork } from '../driven/prisma/prisma-unit-of-work.adapter';
import { IntegrationConsumer } from '../driving/in-process/integration.consumer';
import { Wiring } from './shared.composition';

@Global()
@Module({
	providers: [
		{ provide: PrismaClient, useFactory: () => new PrismaClient() },
		Wiring.construct(PrismaUnitOfWork, [PrismaClient]),
		{ provide: UnitOfWork, useExisting: PrismaUnitOfWork },
		Wiring.construct(IntegrationConsumer, [PrismaUnitOfWork]),
		// Clock, IdGenerator (UUIDv7), Outbox, CorrelationContext, and the forwarder that feeds IntegrationConsumer
	],
	exports: [
		PrismaClient,
		PrismaUnitOfWork,
		UnitOfWork,
		Clock,
		IdGenerator,
		Outbox,
		CorrelationContext,
		IntegrationConsumer,
	],
})
export class SharedModule implements OnApplicationShutdown {
	readonly #prisma: PrismaClient;

	constructor(@Inject(PrismaClient) prisma: PrismaClient) {
		this.#prisma = prisma;
	}

	async onApplicationShutdown(): Promise<void> {
		await this.#prisma.$disconnect();
	}
}
