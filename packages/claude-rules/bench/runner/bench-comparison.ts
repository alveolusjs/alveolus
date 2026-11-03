import { join } from 'node:path';

import { TicketRecord } from './ticket-record.ts';
import { criteria } from './verdict.ts';

export class BenchComparison {
	readonly #base: string;
	readonly #head: string;
	readonly #baseRecords: readonly TicketRecord[];
	readonly #headRecords: readonly TicketRecord[];

	public constructor(resultsDir: string, base: string, head: string) {
		this.#base = base;
		this.#head = head;
		this.#baseRecords = TicketRecord.readAll(join(resultsDir, base));
		this.#headRecords = TicketRecord.readAll(join(resultsDir, head));
	}

	public render(): string {
		return [
			`# ${this.#head} against ${this.#base}`,
			this.#table(
				['Measure', this.#base, this.#head, 'Change'],
				[
					...criteria.map((criterion) =>
						this.#scoreRow(criterion, (record) => record.verdict?.scores[criterion]),
					),
					this.#scoreRow('**mean**', (record) => record.mean()),
					this.#countRow('approved', (record) => record.verdict?.verdict === 'approve'),
					this.#countRow('check passed', (record) => record.passed),
					this.#sumRow('cost of the designs ($)', (record) => record.designCost),
					this.#sumRow('minutes', (record) => record.minutes),
				],
			),
			'## By ticket',
			this.#table(['Ticket', this.#base, this.#head, 'Change'], this.#ticketRows()),
		].join('\n\n');
	}

	#scoreRow(label: string, score: (record: TicketRecord) => number | undefined): string[] {
		const base = this.#average(this.#baseRecords.map(score));
		const head = this.#average(this.#headRecords.map(score));

		return [label, base.toFixed(2), head.toFixed(2), this.#signed(head - base)];
	}

	#countRow(label: string, counts: (record: TicketRecord) => boolean): string[] {
		const base = this.#baseRecords.filter(counts).length;
		const head = this.#headRecords.filter(counts).length;

		return [
			label,
			`${base}/${this.#baseRecords.length}`,
			`${head}/${this.#headRecords.length}`,
			this.#signed(head - base, 0),
		];
	}

	#sumRow(label: string, value: (record: TicketRecord) => number): string[] {
		const base = this.#baseRecords.reduce((sum, record) => sum + value(record), 0);
		const head = this.#headRecords.reduce((sum, record) => sum + value(record), 0);

		return [label, base.toFixed(1), head.toFixed(1), base === 0 ? 'n/a' : `×${(head / base).toFixed(1)}`];
	}

	#ticketRows(): string[][] {
		return this.#headRecords.map((head) => {
			const base = this.#baseRecords.find((record) => record.ticket === head.ticket);
			const before = base?.mean();
			const after = head.mean();
			const change = before === undefined || after === undefined ? 'n/a' : this.#signed(after - before);

			return [head.ticket, before?.toFixed(2) ?? 'n/a', after?.toFixed(2) ?? 'n/a', change];
		});
	}

	#average(values: readonly (number | undefined)[]): number {
		const known = values.filter((value) => value !== undefined);

		return known.length === 0 ? 0 : known.reduce((sum, value) => sum + value, 0) / known.length;
	}

	#signed(value: number, digits = 2): string {
		return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
	}

	#table(header: readonly string[], rows: readonly (readonly string[])[]): string {
		return [
			`| ${header.join(' | ')} |`,
			`| ${header.map(() => '---').join(' | ')} |`,
			...rows.map((row) => `| ${row.join(' | ')} |`),
		].join('\n');
	}
}
