const localIdentifier = /(?<![\p{L}\p{N}_])(D|Q|W|ADR)-([A-Z])(\d+)(?![\p{L}\p{N}_])/gu;
const definitionRow = /^\|\s*[`*]*((?:D|Q|W|ADR)-[A-Z]\d+)[`*]*\s*\|/u;

export type Renumbering = {
	readonly text: string;
	readonly undefinedIds: readonly string[];
};

export class LocalIdentifiers {
	readonly #text: string;

	public constructor(text: string) {
		this.#text = text;
	}

	public renumber(): Renumbering {
		const globals = this.#globals();
		const undefinedIds = new Set<string>();
		const text = this.#text.replaceAll(localIdentifier, (local: string) => {
			const global = globals.get(local);

			if (global === undefined) {
				undefinedIds.add(local);

				return local;
			}

			return global;
		});

		return { text, undefinedIds: [...undefinedIds] };
	}

	#globals(): Map<string, string> {
		const globals = new Map<string, string>();
		const counters = new Map<string, number>();

		for (const line of this.#text.split('\n')) {
			const local = definitionRow.exec(line.trim())?.[1];

			if (local === undefined || globals.has(local)) {
				continue;
			}

			const kind = local.replace(/-.*$/, '');
			const number = (counters.get(kind) ?? 0) + 1;

			counters.set(kind, number);
			globals.set(local, `${kind}-${number}`);
		}

		return globals;
	}
}
