import { describe, expect, it } from 'vitest';

import { ctx06, lay01, plc07, wir05 } from '../rules.ts';
import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();
const packagesInDomain = `${lay01.describe()} / ${ctx06.describe()}`;

describe('WIR-05 with oxlint', () => {
	it('reports a container decorator imported in application and driven', () => {
		const project = app
			.with('src/wallets/application/wallet/withdraw.command.ts', `import { Injectable } from '@nestjs/common';`)
			.with('src/wallets/driven/http/rates.client.ts', `import { Inject } from '@nestjs/common';`)
			.with('src/wallets/driving/messaging/deposit.consumer.ts', `import { Optional } from '@nestjs/common';`);

		expect(project.oxlint()).toEqual([
			`src/wallets/application/wallet/withdraw.command.ts:1 ${wir05.describe()}`,
			`src/wallets/driven/http/rates.client.ts:1 ${wir05.describe()}`,
			`src/wallets/driving/messaging/deposit.consumer.ts:1 ${wir05.describe()}`,
		]);
	});

	it('reports a container decorator imported under another name or through a namespace', () => {
		const project = app
			.with(
				'src/wallets/application/wallet/withdraw.command.ts',
				`import { Injectable as Service } from '@nestjs/common';`,
			)
			.with('src/wallets/application/wallet/close.command.ts', `import * as common from '@nestjs/common';`);

		expect(project.oxlint()).toEqual([
			`src/wallets/application/wallet/close.command.ts:1 ${wir05.describe()}`,
			`src/wallets/application/wallet/withdraw.command.ts:1 ${wir05.describe()}`,
		]);
	});

	it('leaves the adapters of driving/http, wiring files, tests and other imports of @nestjs/common', () => {
		const project = app
			.with('src/wallets/driving/http/wallet.guard.ts', `import { Injectable } from '@nestjs/common';`)
			.with('src/wallets/wallets.wiring.ts', `import { Inject } from '@nestjs/common';`)
			.with('src/wallets/wallets.config.ts', `import { Injectable } from '@nestjs/common';`)
			.with(
				'src/wallets/application/wallet/__test__/deposit.spec.ts',
				`import { Injectable } from '@nestjs/common';`,
			)
			.with('src/wallets/application/wallet/withdraw.command.ts', `import { Logger } from '@nestjs/common';`);

		expect(project.oxlint()).toEqual([]);
	});
});

describe('PLC-07 with oxlint', () => {
	it('reports Prisma outside driven/prisma and the application of a transaction script', () => {
		const project = app
			.with('src/wallets/driving/messaging/deposit.consumer.ts', `import { PrismaClient } from '@prisma/client';`)
			.with('src/wallets/driven/http/rates.translator.ts', `import type { Wallet } from '@prisma/client';`)
			.with('src/wallets/driving/http/wallet.controller.ts', `import { PrismaClient } from '@prisma/client';`)
			.with('src/wallets/public/wallet.dto.ts', `import type { Wallet } from '@prisma/client';`);

		expect(project.oxlint()).toEqual([
			`src/wallets/driven/http/rates.translator.ts:1 ${plc07.describe()}`,
			`src/wallets/driving/http/wallet.controller.ts:1 ${plc07.describe()}`,
			`src/wallets/driving/messaging/deposit.consumer.ts:1 ${plc07.describe()}`,
			`src/wallets/public/wallet.dto.ts:1 ${plc07.describe()}`,
		]);
	});

	it('reports Swagger outside driving/http', () => {
		const project = app
			.with('src/wallets/application/wallet/wallet.view.ts', `import { ApiProperty } from '@nestjs/swagger';`)
			.with('src/wallets/driving/messaging/deposit.consumer.ts', `import { ApiTags } from '@nestjs/swagger';`)
			.with('src/wallets/public/wallet.dto.ts', `import { ApiProperty } from '@nestjs/swagger';`);

		expect(project.oxlint()).toEqual([
			`src/wallets/application/wallet/wallet.view.ts:1 ${plc07.describe()}`,
			`src/wallets/driving/messaging/deposit.consumer.ts:1 ${plc07.describe()}`,
			`src/wallets/public/wallet.dto.ts:1 ${plc07.describe()}`,
		]);
	});
});

describe('LAY-01 and CTX-06 with oxlint', () => {
	it('reports any package imported in the domain', () => {
		const project = app
			.with('src/wallets/domain/wallet/wallet.errors.ts', `import { z } from 'zod';`)
			.with(
				'src/wallets/domain/wallet/rates.port.ts',
				`import type { GetObjectOutput } from '@aws-sdk/client-s3';`,
			)
			.with('src/wallets/domain/wallet/wallet.events.ts', `import { Injectable } from '@nestjs/common';`)
			.with('src/wallets/domain/wallet/wallet.entity.ts', `import { createHash } from 'crypto';`);

		expect(project.oxlint()).toEqual([
			`src/wallets/domain/wallet/rates.port.ts:1 ${packagesInDomain}`,
			`src/wallets/domain/wallet/wallet.entity.ts:1 ${packagesInDomain}`,
			`src/wallets/domain/wallet/wallet.errors.ts:1 ${packagesInDomain}`,
			`src/wallets/domain/wallet/wallet.events.ts:1 ${packagesInDomain}`,
		]);
	});

	it('leaves @alveolus/core, its entry points, Node modules, relative imports and tests', () => {
		const project = app
			.with(
				'src/wallets/domain/wallet/wallet.events.ts',
				`import { DomainEvent } from '@alveolus/core/domain-events';`,
			)
			.with('src/wallets/domain/wallet/wallet.id.ts', `import { randomUUID } from 'node:crypto';`)
			.with('src/wallets/domain/wallet/wallet.errors.ts', `import { HolderId } from '../holder/holder.id.ts';`);

		expect(project.oxlint()).toEqual([]);
	});
});
