import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const designerTools = [
	'Read',
	'Glob',
	'Grep',
	'Write',
	'Edit',
	'Agent',
	'Bash(npx alveolus-claude:*)',
	'Bash(ls:*)',
	'Bash(git status:*)',
	'Bash(git log:*)',
];

export class BenchSettings {
	readonly #benchDir: string;
	readonly #label: string;
	readonly #tickets: readonly string[];
	readonly #model: string;
	readonly #concurrency: number;

	private constructor(
		benchDir: string,
		label: string,
		tickets: readonly string[],
		model: string,
		concurrency: number,
	) {
		this.#benchDir = benchDir;
		this.#label = label;
		this.#tickets = tickets;
		this.#model = model;
		this.#concurrency = concurrency;
	}

	public static fromArguments(benchDir: string, args: readonly string[]): BenchSettings {
		const { values } = parseArgs({
			args: [...args],
			options: {
				label: { type: 'string' },
				tickets: { type: 'string' },
				model: { type: 'string', default: 'opus' },
				concurrency: { type: 'string', default: '3' },
			},
		});

		if (values.label === undefined) {
			throw new Error('Usage: node bench/run.ts --label <name> [--tickets a,b] [--model opus] [--concurrency 3]');
		}

		const all = readdirSync(join(benchDir, 'tickets')).filter((file) => file.endsWith('.md'));
		const chosen = values.tickets?.split(',').map((ticket) => `${ticket.replace(/\.md$/, '')}.md`) ?? all;

		return new BenchSettings(benchDir, values.label, chosen, values.model, Number(values.concurrency));
	}

	public get label(): string {
		return this.#label;
	}

	public get model(): string {
		return this.#model;
	}

	public get concurrency(): number {
		return this.#concurrency;
	}

	public get tickets(): string[] {
		return this.#tickets.map((ticket) => join(this.#benchDir, 'tickets', ticket));
	}

	public get appDir(): string {
		return join(this.#benchDir, 'app');
	}

	public get packageDir(): string {
		return join(this.#benchDir, '..');
	}

	public get rubric(): string {
		return join(this.#benchDir, 'rubric.md');
	}

	public get verdictSchema(): string {
		return join(this.#benchDir, 'verdict.schema.json');
	}

	public get resultsDir(): string {
		return join(this.#benchDir, 'results', this.#label);
	}

	public get designerTools(): readonly string[] {
		return designerTools;
	}

	public get designBudget(): number {
		return 25;
	}

	public get judgeBudget(): number {
		return 5;
	}
}
