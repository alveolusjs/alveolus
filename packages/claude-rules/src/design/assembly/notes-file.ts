const slotMarker = /^<!--\s*slot:\s*([\w.]+)\s*-->\s*$/;

export type NotesBlock = {
	readonly slot: string;
	readonly text: string;
};

export class NotesFile {
	readonly #name: string;
	readonly #blocks: NotesBlock[] = [];

	public constructor(name: string, text: string) {
		this.#name = name;
		this.#read(text.split(/\r?\n/));
	}

	public get name(): string {
		return this.#name;
	}

	public get blocks(): readonly NotesBlock[] {
		return this.#blocks;
	}

	#read(lines: readonly string[]): void {
		let slot: string | undefined;
		let body: string[] = [];

		for (const line of lines) {
			const marker = slotMarker.exec(line.trim());

			if (marker === null) {
				body.push(line);
				continue;
			}

			this.#close(slot, body);
			slot = marker[1];
			body = [];
		}

		this.#close(slot, body);
	}

	#close(slot: string | undefined, body: readonly string[]): void {
		const text = body.join('\n').trim();

		if (slot !== undefined && text !== '') {
			this.#blocks.push({ slot, text });
		}
	}
}
