import { describe, expect, it } from 'vitest';

import { TestProject } from '../../__test__/support/test-project.ts';

const app = TestProject.app();

describe('architecture.json', () => {
	it('is required', () => {
		const project = app.without('architecture.json');

		expect(() => project.fitness()).toThrow(
			'architecture.json not found: declare each bounded context and its style, as CTX-14 says.',
		);
	});

	it('is valid JSON', () => {
		const project = app.with('architecture.json', '{ "contexts": ');

		expect(() => project.fitness()).toThrow('architecture.json is not valid JSON');
	});

	it('maps at least one bounded context to its style', () => {
		const project = app.with('architecture.json', '{ "contexts": {} }');

		expect(() => project.fitness()).toThrow(
			'architecture.json: "contexts" must map each bounded context to its style.',
		);
	});

	it('gives each bounded context a known style', () => {
		const project = app.with(
			'architecture.json',
			'{ "contexts": { "wallets": "hexagonal", "notifications": "tactical" } }',
		);

		expect(() => project.fitness()).toThrow(
			'architecture.json: wallets has style "hexagonal", expected one of tactical, transaction-script, big-ball-of-mud.',
		);
	});

	it('gives each bounded context a folder of the project', () => {
		const project = app.with(
			'architecture.json',
			'{ "contexts": { "wallets": { "style": "tactical", "path": "../wallets" }, "notifications": "tactical" } }',
		);

		expect(() => project.fitness()).toThrow(
			'architecture.json: wallets has a "path" outside the project: ../wallets.',
		);
	});

	it('gives each bounded context a folder that exists', () => {
		const project = app.with(
			'architecture.json',
			'{ "contexts": { "wallets": "tactical", "notifications": "tactical", "payments": "tactical" } }',
		);

		expect(() => project.fitness()).toThrow(
			'architecture.json: payments lives in src/payments, which is not a folder.',
		);
	});

	it('declares every folder of src except shared', () => {
		const project = app.with('src/ledger/domain/entry.ts', 'export class Entry {}');

		expect(() => project.fitness()).toThrow(
			'architecture.json: src/ledger not declared: declare each bounded context and its style, as CTX-14 says.',
		);
	});

	it('accepts the long form, with a bounded context outside src', () => {
		const project = app
			.with(
				'architecture.json',
				'{ "contexts": { "wallets": "tactical", "notifications": "transaction-script", "legacy": { "style": "big-ball-of-mud", "path": "legacy/app" } } }',
			)
			.with('legacy/app/users.ts', 'export class Users {}');

		expect(() => project.fitness()).not.toThrow();
	});
});
