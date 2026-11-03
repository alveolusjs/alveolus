import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { BenchSettings } from './bench-settings.ts';
import type { TicketOutcome } from './ticket-run.ts';
import { criteria } from './verdict.ts';

export class BenchReport {
	readonly #settings: BenchSettings;
	readonly #outcomes: readonly TicketOutcome[];

	public constructor(settings: BenchSettings, outcomes: readonly TicketOutcome[]) {
		this.#settings = settings;
		this.#outcomes = outcomes;
	}

	public write(): string {
		const folder = this.#settings.resultsDir;

		for (const outcome of this.#outcomes) {
			this.#writeTicket(join(folder, outcome.ticket), outcome);
		}

		const summary = this.#summary();
		writeFileSync(join(folder, 'summary.md'), summary);

		return summary;
	}

	#writeTicket(folder: string, outcome: TicketOutcome): void {
		mkdirSync(folder, { recursive: true });
		writeFileSync(join(folder, 'response.md'), `${outcome.design.result.trim()}\n`);

		if (outcome.designText !== undefined) {
			writeFileSync(join(folder, 'design.md'), outcome.designText);
		}

		const record = {
			design: { ...outcome.design, result: undefined, structuredOutput: undefined },
			check: outcome.check === undefined ? undefined : { ...outcome.check },
			judge: { ...outcome.judge, result: undefined, structuredOutput: undefined },
			verdict: outcome.verdict,
		};

		writeFileSync(join(folder, 'outcome.json'), `${JSON.stringify(record, null, '\t')}\n`);
	}

	#summary(): string {
		const header = ['Ticket', 'Check', ...criteria, 'Mean', 'Verdict', 'Cost ($)', 'Minutes', 'Subagents'];
		const rows = this.#outcomes.map((outcome) => this.#row(outcome));

		return [
			`# Bench · ${this.#settings.label}`,
			`Model: ${this.#settings.model}. Judge: the same model, with \`rubric.md\`.`,
			[
				`| ${header.join(' | ')} |`,
				`| ${header.map(() => '---').join(' | ')} |`,
				...rows.map((row) => `| ${row.join(' | ')} |`),
				`| ${this.#totals().join(' | ')} |`,
			].join('\n'),
			...this.#outcomes.map((outcome) => this.#problems(outcome)),
		].join('\n\n');
	}

	#row(outcome: TicketOutcome): string[] {
		const scores = criteria.map((criterion) => this.#format(outcome.verdict?.scores[criterion]));

		return [
			outcome.ticket,
			this.#checkCell(outcome),
			...scores,
			this.#format(this.#mean(outcome)),
			outcome.verdict?.verdict ?? 'n/a',
			(outcome.design.costUsd + outcome.judge.costUsd).toFixed(2),
			(outcome.design.durationMs / 60000).toFixed(1),
			String(outcome.design.subagents),
		];
	}

	#totals(): string[] {
		const judged = this.#outcomes.filter((outcome) => outcome.verdict !== undefined);
		const means = criteria.map((criterion) =>
			this.#format(this.#average(judged.map((outcome) => outcome.verdict?.scores[criterion] ?? 0))),
		);
		const passed = this.#outcomes.filter((outcome) => outcome.check?.passed === true).length;
		const cost = this.#outcomes.reduce((sum, outcome) => sum + outcome.design.costUsd + outcome.judge.costUsd, 0);
		const minutes = this.#outcomes.reduce((sum, outcome) => sum + outcome.design.durationMs, 0) / 60000;

		return [
			'**All**',
			`${passed}/${this.#outcomes.length} passed`,
			...means,
			this.#format(this.#average(judged.map((outcome) => this.#mean(outcome) ?? 0))),
			`${judged.filter((outcome) => outcome.verdict?.verdict === 'approve').length} approved`,
			cost.toFixed(2),
			minutes.toFixed(1),
			'',
		];
	}

	#problems(outcome: TicketOutcome): string {
		const problems = outcome.verdict?.problems ?? ['No verdict: the judge failed.'];

		return [`## ${outcome.ticket}`, ...problems.map((problem) => `- ${problem}`)].join('\n\n');
	}

	#checkCell(outcome: TicketOutcome): string {
		if (outcome.check === undefined) {
			return 'no design';
		}

		return outcome.check.passed ? 'passed' : `${outcome.check.problems} problems`;
	}

	#mean(outcome: TicketOutcome): number | undefined {
		const scores = outcome.verdict?.scores;

		return scores === undefined ? undefined : this.#average(criteria.map((criterion) => scores[criterion]));
	}

	#average(values: readonly number[]): number {
		return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
	}

	#format(value: number | undefined): string {
		return value === undefined ? 'n/a' : value.toFixed(2);
	}
}
