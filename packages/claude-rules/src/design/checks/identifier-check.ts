import type { Finding } from '../finding.ts';
import type { IdentifierIndex, Occurrence } from '../identifier-index.ts';
import { identifierKinds } from '../identifier-kind.ts';

const states = ['todo', 'done'];
const stateColumn = 6;

export class IdentifierCheck {
	readonly #index: IdentifierIndex;

	public constructor(index: IdentifierIndex) {
		this.#index = index;
	}

	public findings(): Finding[] {
		return [...this.#definitions(), ...this.#cells(), ...this.#states(), ...this.#proofs()];
	}

	#definitions(): Finding[] {
		const findings: Finding[] = [];

		for (const id of this.#index.ids()) {
			const occurrences = this.#index.occurrencesOf(id);
			const definitions = occurrences.filter((occurrence) => occurrence.definition);
			const [first] = occurrences;
			const [, second] = definitions;

			if (definitions.length === 0 && first !== undefined) {
				findings.push({
					line: first.line,
					message: `${id} is cited but never defined: define it in ${first.kind.home()}`,
				});
			}

			if (second !== undefined) {
				const lines = definitions.map((definition) => definition.line).join(', ');

				findings.push({
					line: second.line,
					message: `${id} is defined ${definitions.length} times, at lines ${lines}: define it once`,
				});
			}
		}

		return findings;
	}

	#cells(): Finding[] {
		const findings: Finding[] = [];

		for (const definition of this.#index.definitions()) {
			findings.push(...this.#cellsOf(definition));
		}

		return findings;
	}

	#cellsOf({ id, kind, line, row }: Occurrence): Finding[] {
		if (row === undefined) {
			return [];
		}

		if (row.cells.length < kind.cells) {
			return [{ line, message: `${id}: the row has ${row.cells.length} cells, ${kind.cells} expected` }];
		}

		return kind.required
			.filter((column) => (row.cells[column.index] ?? '') === '')
			.map((column) => ({ line, message: `${id}: ${column.name} is empty` }));
	}

	#states(): Finding[] {
		const findings: Finding[] = [];

		for (const { id, line, row } of this.#index.definitionsOf('I')) {
			const state = row?.cells[stateColumn] ?? '';

			if (!states.includes(state)) {
				findings.push({ line, message: `${id}: State is "${state}", expected todo or done` });
			}
		}

		return findings;
	}

	#proofs(): Finding[] {
		const proven = this.#proven();
		const findings: Finding[] = [];

		for (const { id, line } of [...this.#index.definitionsOf('AC'), ...this.#index.definitionsOf('INV')]) {
			if (!proven.has(id)) {
				findings.push({
					line,
					message: `${id} is proven by no test: cite it in the Proves column of a T row in section 15`,
				});
			}
		}

		return findings;
	}

	#proven(): Set<string> {
		const proven = new Set<string>();
		const provable = identifierKinds.filter((kind) => kind.is('AC') || kind.is('INV'));

		for (const { row } of this.#index.definitionsOf('T')) {
			for (const cell of row?.cells.slice(1) ?? []) {
				for (const kind of provable) {
					for (const id of kind.find(cell)) {
						proven.add(id);
					}
				}
			}
		}

		return proven;
	}
}
