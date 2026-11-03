import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { criteria, type Verdict } from './verdict.ts';

type SessionMetrics = {
	readonly costUsd: number;
	readonly durationMs: number;
	readonly subagents: number;
};

type RecordFile = {
	readonly design: SessionMetrics;
	readonly judge: SessionMetrics;
	readonly check?: { readonly passed: boolean; readonly problems: number };
	readonly verdict?: Verdict;
};

export class TicketRecord {
	readonly #ticket: string;
	readonly #file: RecordFile;

	private constructor(ticket: string, file: RecordFile) {
		this.#ticket = ticket;
		this.#file = file;
	}

	public static readAll(resultsDir: string): TicketRecord[] {
		if (!existsSync(resultsDir)) {
			return [];
		}

		return readdirSync(resultsDir)
			.filter((ticket) => existsSync(join(resultsDir, ticket, 'outcome.json')))
			.toSorted()
			.map((ticket) => {
				const file: RecordFile = JSON.parse(readFileSync(join(resultsDir, ticket, 'outcome.json'), 'utf8'));

				return new TicketRecord(ticket, file);
			});
	}

	public get ticket(): string {
		return this.#ticket;
	}

	public get verdict(): Verdict | undefined {
		return this.#file.verdict;
	}

	public get cost(): number {
		return this.#file.design.costUsd + this.#file.judge.costUsd;
	}

	public get designCost(): number {
		return this.#file.design.costUsd;
	}

	public get minutes(): number {
		return this.#file.design.durationMs / 60000;
	}

	public get subagents(): number {
		return this.#file.design.subagents;
	}

	public get passed(): boolean {
		return this.#file.check?.passed === true;
	}

	public checkCell(): string {
		if (this.#file.check === undefined) {
			return 'no design';
		}

		return this.#file.check.passed ? 'passed' : `${this.#file.check.problems} problems`;
	}

	public mean(): number | undefined {
		const scores = this.#file.verdict?.scores;

		if (scores === undefined) {
			return undefined;
		}

		return criteria.reduce((sum, criterion) => sum + scores[criterion], 0) / criteria.length;
	}
}
