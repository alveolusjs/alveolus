const slotMarker = /^<!--\s*slot:\s*([\w.]+)\s*-->\s*$/;
const separatorRow = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/;
const identifiedRow = /^\|\s*[`*]*[A-Z]{1,3}-[A-Z]?\d+/;

export class Skeleton {
	readonly #lines: readonly string[];

	public constructor(text: string) {
		this.#lines = text.split(/\r?\n/);
	}

	public slots(): string[] {
		return this.#lines.flatMap((line) => {
			const slot = slotMarker.exec(line.trim())?.[1];

			return slot === undefined ? [] : [slot];
		});
	}

	public fill(contents: ReadonlyMap<string, readonly string[]>, none: string): string {
		const output: string[] = [];

		for (const line of this.#lines) {
			const slot = slotMarker.exec(line.trim())?.[1];

			if (slot === undefined) {
				output.push(line);
				continue;
			}

			const blocks = contents.get(slot) ?? [];

			if (this.#closesTableHeader(output)) {
				this.#fillTable(output, blocks, none);
				continue;
			}

			output.push(blocks.length === 0 ? none : blocks.join('\n\n'));
		}

		return output.join('\n').replace(/\n{3,}/g, '\n\n');
	}

	#closesTableHeader(output: readonly string[]): boolean {
		const separator = output.at(-1)?.trim() ?? '';

		return separatorRow.test(separator) && (output.at(-2)?.trim().startsWith('|') ?? false);
	}

	#fillTable(output: string[], blocks: readonly string[], none: string): void {
		const rows = blocks.flatMap((block) => block.split('\n')).filter((row) => identifiedRow.test(row.trim()));

		if (rows.length > 0) {
			output.push(...rows);

			return;
		}

		output.splice(-2, 2, none);
	}
}
