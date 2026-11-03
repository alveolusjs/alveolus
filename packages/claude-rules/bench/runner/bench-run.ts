import { BenchReport } from './bench-report.ts';
import type { BenchSettings } from './bench-settings.ts';
import { type TicketOutcome, TicketRun } from './ticket-run.ts';

export class BenchRun {
	readonly #settings: BenchSettings;

	public constructor(settings: BenchSettings) {
		this.#settings = settings;
	}

	public async run(): Promise<string> {
		const queue = [...this.#settings.tickets];
		const outcomes: TicketOutcome[] = [];
		const workers = Array.from({ length: this.#settings.concurrency }, () => this.#work(queue, outcomes));

		await Promise.all(workers);

		const ordered = outcomes.toSorted((left, right) => left.ticket.localeCompare(right.ticket));

		return new BenchReport(this.#settings, ordered).write();
	}

	async #work(queue: string[], outcomes: TicketOutcome[]): Promise<void> {
		for (let ticket = queue.shift(); ticket !== undefined; ticket = queue.shift()) {
			console.log(`start  ${ticket}`);

			try {
				const outcome = await new TicketRun(ticket, this.#settings).run();
				outcomes.push(outcome);
				console.log(`done   ${outcome.ticket} in ${outcome.app}`);
			} catch (error) {
				console.error(`failed ${ticket}: ${String(error)}`);
			}
		}
	}
}
