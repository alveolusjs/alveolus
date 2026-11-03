import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

import type { BenchSettings } from './bench-settings.ts';
import { ClaudeSession, type SessionResult } from './claude-session.ts';
import { type CheckOutcome, DesignCheckRun } from './design-check-run.ts';
import { ScratchApp } from './scratch-app.ts';
import type { Verdict } from './verdict.ts';

export type TicketOutcome = {
	readonly ticket: string;
	readonly app: string;
	readonly design: SessionResult;
	readonly designText: string | undefined;
	readonly check: CheckOutcome | undefined;
	readonly judge: SessionResult;
	readonly verdict: Verdict | undefined;
};

export class TicketRun {
	readonly #ticket: string;
	readonly #settings: BenchSettings;

	public constructor(ticket: string, settings: BenchSettings) {
		this.#ticket = ticket;
		this.#settings = settings;
	}

	public async run(): Promise<TicketOutcome> {
		const app = ScratchApp.create(this.#settings.appDir, this.#settings.packageDir, this.#ticket);
		const design = await this.#design(app);
		const [file] = app.designs();
		const check = file === undefined ? undefined : new DesignCheckRun(this.#settings.packageDir).check(file);

		writeFileSync(join(app.root, 'bench-response.md'), design.result);

		const judge = await this.#judge(app, file);

		return {
			ticket: basename(this.#ticket, '.md'),
			app: app.root,
			design,
			designText: file === undefined ? undefined : readFileSync(file, 'utf8'),
			check,
			judge,
			verdict: this.#verdictOf(judge),
		};
	}

	#design(app: ScratchApp): Promise<SessionResult> {
		return new ClaudeSession({
			cwd: app.root,
			prompt: `/alveolus-design tickets/${basename(this.#ticket)}`,
			model: this.#settings.model,
			budget: this.#settings.designBudget,
			allowedTools: this.#settings.designerTools,
			permissionMode: 'acceptEdits',
		}).run();
	}

	#judge(app: ScratchApp, file: string | undefined): Promise<SessionResult> {
		const design = file === undefined ? 'none: the agent wrote no design file' : `\`${relative(app.root, file)}\``;
		const prompt = readFileSync(this.#settings.rubric, 'utf8')
			.replace('{{ticket}}', `tickets/${basename(this.#ticket)}`)
			.replace('{{design}}', design)
			.replace('{{response}}', 'bench-response.md');

		return new ClaudeSession({
			cwd: app.root,
			prompt,
			model: this.#settings.model,
			budget: this.#settings.judgeBudget,
			allowedTools: ['Read', 'Glob', 'Grep'],
			permissionMode: 'dontAsk',
			jsonSchema: readFileSync(this.#settings.verdictSchema, 'utf8'),
		}).run();
	}

	#verdictOf(judge: SessionResult): Verdict | undefined {
		if (judge.isError || judge.structuredOutput === undefined) {
			return undefined;
		}

		const verdict: Verdict = JSON.parse(judge.result);

		return verdict;
	}
}
