import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { BenchSettings } from './bench-settings.ts';
import { TicketRecord } from './ticket-record.ts';
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

		const summary = this.#summary(TicketRecord.readAll(folder));
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

	#summary(records: readonly TicketRecord[]): string {
		const header = ['Ticket', 'Check', ...criteria, 'Mean', 'Verdict', 'Cost ($)', 'Minutes', 'Subagents'];

		return [
			`# Bench · ${this.#settings.label}`,
			`Model: ${this.#settings.model}. Judge: the same model, with \`rubric.md\`.`,
			[
				`| ${header.join(' | ')} |`,
				`| ${header.map(() => '---').join(' | ')} |`,
				...records.map((record) => `| ${this.#row(record).join(' | ')} |`),
				`| ${this.#totals(records).join(' | ')} |`,
			].join('\n'),
			...records.map((record) => this.#problems(record)),
		].join('\n\n');
	}

	#row(record: TicketRecord): string[] {
		const scores = criteria.map((criterion) => this.#format(record.verdict?.scores[criterion]));

		return [
			record.ticket,
			record.checkCell(),
			...scores,
			this.#format(record.mean()),
			record.verdict?.verdict ?? 'n/a',
			record.cost.toFixed(2),
			record.minutes.toFixed(1),
			String(record.subagents),
		];
	}

	#totals(records: readonly TicketRecord[]): string[] {
		const judged = records.filter((record) => record.verdict !== undefined);
		const means = criteria.map((criterion) =>
			this.#format(this.#average(judged.map((record) => record.verdict?.scores[criterion] ?? 0))),
		);
		const passed = records.filter((record) => record.passed).length;
		const cost = records.reduce((sum, record) => sum + record.cost, 0);
		const minutes = records.reduce((sum, record) => sum + record.minutes, 0);

		return [
			'**All**',
			`${passed}/${records.length} passed`,
			...means,
			this.#format(this.#average(judged.map((record) => record.mean() ?? 0))),
			`${judged.filter((record) => record.verdict?.verdict === 'approve').length} approved`,
			cost.toFixed(2),
			minutes.toFixed(1),
			'',
		];
	}

	#problems(record: TicketRecord): string {
		const problems = record.verdict?.problems ?? ['No verdict: the judge failed.'];

		return [`## ${record.ticket}`, ...problems.map((problem) => `- ${problem}`)].join('\n\n');
	}

	#average(values: readonly number[]): number {
		return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
	}

	#format(value: number | undefined): string {
		return value === undefined ? 'n/a' : value.toFixed(2);
	}
}
