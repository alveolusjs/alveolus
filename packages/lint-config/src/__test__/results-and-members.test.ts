import { describe, expect, it } from 'vitest';

import { nam09, uc11 } from '../rules.ts';
import { TestApp } from './support/test-app.ts';

const result = `export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export abstract class Ledger {
	public abstract post(amount: number): Promise<Result<void, string>>;
	public abstract block(): Result<void, string>;
	public abstract close(): void;
	public abstract notify(): Promise<void>;
}
`;

const app = TestApp.reference().with('src/wallets/domain/wallet/ledger.port.ts', result);
const command = 'src/wallets/application/wallet/transfer.command.ts';

function useCase(body: string): string {
	return `import type { Ledger } from '../../domain/wallet/ledger.port.ts';

export class Transfer {
	readonly #ledger: Ledger;

	public constructor(ledger: Ledger) {
		this.#ledger = ledger;
	}

	public async run(): Promise<unknown> {
${body}
	}
}
`;
}

describe('UC-11 with ESLint', () => {
	it('reports a Result dropped as a statement, awaited, voided or not', () => {
		const project = app.with(
			command,
			useCase(
				[
					'\t\tthis.#ledger.block();',
					'\t\tawait this.#ledger.post(1);',
					'\t\tvoid this.#ledger.post(2);',
					'\t\treturn 0;',
				].join('\n'),
			),
		);

		expect(project.eslint(uc11)).toEqual([
			`${command}:11 ${uc11.describe()}`,
			`${command}:12 ${uc11.describe()}`,
			`${command}:13 ${uc11.describe()}`,
		]);
	});

	it('leaves a Result that is kept, tested or returned, and a call that returns nothing', () => {
		const project = app.with(
			command,
			useCase(
				[
					'\t\tthis.#ledger.close();',
					'\t\tconst posted = await this.#ledger.post(1);',
					'',
					'\t\tif (!posted.ok) {',
					'\t\t\treturn posted;',
					'\t\t}',
					'',
					'\t\treturn this.#ledger.block();',
				].join('\n'),
			),
		);

		expect(project.eslint(uc11)).toEqual([]);
	});

	it('reports a Result kept in a variable that nothing reads', () => {
		const project = app.with(
			command,
			useCase(['\t\tconst posted = await this.#ledger.post(1);', '\t\treturn 0;'].join('\n')),
		);

		expect(project.eslint(uc11)).toEqual([`${command}:11 ${uc11.describe()}`]);
	});

	it('leaves a Result assigned to a field or a variable', () => {
		const refusal = 'src/wallets/application/wallet/refusal.ts';
		const project = app
			.with(
				refusal,
				`import type { Result } from '../../domain/wallet/ledger.port.ts';

export class Refusal {
	readonly #result: Result<void, string>;

	public constructor(result: Result<void, string>) {
		this.#result = result;
	}

	public result(): Result<void, string> {
		return this.#result;
	}
}
`,
			)
			.with(
				command,
				useCase(['\t\tlet latest;', '\t\tlatest = this.#ledger.block();', '', '\t\treturn latest;'].join('\n')),
			);

		expect(project.eslint(uc11)).toEqual([]);
	});

	it('reports a Result or its promise kept in a typed variable that nothing reads', () => {
		const project = app.with(
			command,
			useCase(
				[
					"\t\tconst blocked: ReturnType<Ledger['block']> = this.#ledger.block();",
					'\t\tconst pending = this.#ledger.post(1);',
					'\t\treturn 0;',
				].join('\n'),
			),
		);

		expect(project.eslint(uc11)).toEqual([`${command}:11 ${uc11.describe()}`, `${command}:12 ${uc11.describe()}`]);
	});

	it('leaves a variable, a parameter and a promise that hold no Result', () => {
		const consumer = 'src/wallets/application/wallet/consumer.ts';
		const project = app
			.with(
				consumer,
				`import type { Result } from '../../domain/wallet/ledger.port.ts';

export abstract class Consumer {
	protected async handle(_event: string): Promise<void> {}

	protected async afterCommit(_outcome: Result<void, string>): Promise<void> {}
}
`,
			)
			.with(
				command,
				useCase(['\t\tconst amount = 1;', '\t\tthis.#ledger.notify();', '\t\treturn 0;'].join('\n')),
			);

		expect(project.eslint(uc11)).toEqual([]);
	});

	it('reports a promise of a Result that is never awaited', () => {
		const project = app.with(command, useCase(['\t\tthis.#ledger.post(1);', '\t\treturn 0;'].join('\n')));

		expect(project.eslint(uc11)).toEqual([`${command}:11 ${uc11.describe()}`]);
	});
});

describe('NAM-09 with ESLint', () => {
	it('reports a parameter property, and leaves a # field', () => {
		const project = app
			.with(
				'src/wallets/application/wallet/close.command.ts',
				`export class Close {\n\tpublic constructor(private readonly clock: Date) {}\n}\n`,
			)
			.with(command, useCase('\t\treturn 0;'));

		expect(project.eslint(nam09)).toEqual([
			`src/wallets/application/wallet/close.command.ts:2 ${nam09.describe()}`,
		]);
	});
});
