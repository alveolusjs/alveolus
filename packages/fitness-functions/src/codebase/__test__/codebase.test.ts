import { describe, expect, it } from 'vitest';

import { TestProject } from '../../__test__/support/test-project.ts';

const app = TestProject.app();
const notify = 'src/notifications/application/notify.ts';

describe('Codebase', () => {
	it('refuses a relative import that does not resolve', () => {
		const project = app.with(notify, `import { Gone } from '../../wallets/domain/gone.ts';`);

		expect(() => project.fitness()).toThrow(
			`These imports do not resolve, so no rule can follow them:\n${notify}:1 imports '../../wallets/domain/gone.ts'`,
		);
	});

	it('refuses an alias that does not resolve', () => {
		const project = app.with(notify, `import { Gone } from '@wallets/domain/gone.ts';`);

		expect(() => project.fitness()).toThrow(`${notify}:1 imports '@wallets/domain/gone.ts'`);
	});

	it('refuses a package the app does not declare', () => {
		const project = app.with(notify, `import { Injectable } from '@nestjs/common';`);

		expect(() => project.fitness()).toThrow(`${notify}:1 imports '@nestjs/common'`);
	});

	it('accepts a declared package that is not installed, and a Node module', () => {
		const project = app
			.with('package.json', '{ "dependencies": { "@nestjs/common": "^11.0.0" } }')
			.with(
				notify,
				`import { Injectable } from '@nestjs/common';\nimport { join } from 'node:path';\nimport fs from 'fs';`,
			);

		expect(() => project.fitness()).not.toThrow();
	});

	it('resolves a package that only ships types', () => {
		const project = app
			.with('node_modules/@types/express/package.json', '{ "name": "@types/express", "types": "index.d.ts" }')
			.with('node_modules/@types/express/index.d.ts', 'export interface Request {}')
			.with(notify, `import type { Request } from 'express';`);

		expect(() => project.fitness()).not.toThrow();
	});
});
