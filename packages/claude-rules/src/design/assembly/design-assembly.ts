import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LocalIdentifiers } from './local-identifiers.ts';
import { NotesFile } from './notes-file.ts';
import { Skeleton } from './skeleton.ts';

const agents = [
	'analyst',
	'explorer',
	'strategist',
	'modeler',
	'integrator',
	'architect',
	'tester',
	'operator',
	'designer',
];
const ignoredSlots = ['requests'];

export type AssemblyResult = {
	readonly text: string;
	readonly warnings: readonly string[];
};

export class DesignAssembly {
	readonly #workDir: string;
	readonly #none: string;

	public constructor(workDir: string, none: string) {
		this.#workDir = workDir;
		this.#none = none;
	}

	public assemble(): AssemblyResult {
		const skeleton = new Skeleton(readFileSync(join(this.#workDir, 'skeleton.md'), 'utf8'));
		const slots = new Set(skeleton.slots());
		const contents = new Map<string, string[]>();
		const warnings: string[] = [];

		for (const notes of this.#notes()) {
			for (const block of notes.blocks) {
				if (ignoredSlots.includes(block.slot)) {
					continue;
				}

				if (!slots.has(block.slot)) {
					warnings.push(
						`${notes.name}: the slot "${block.slot}" is not in the skeleton, its text is left out`,
					);
					continue;
				}

				contents.set(block.slot, [...(contents.get(block.slot) ?? []), block.text]);
			}
		}

		const { text, undefinedIds } = new LocalIdentifiers(skeleton.fill(contents, this.#none)).renumber();

		for (const id of undefinedIds) {
			warnings.push(`${id} is cited but no agent defines it in a table row`);
		}

		return { text, warnings };
	}

	#notes(): NotesFile[] {
		return agents
			.map((agent) => join(this.#workDir, `${agent}.md`))
			.filter((path) => existsSync(path))
			.map((path) => new NotesFile(path.slice(this.#workDir.length + 1), readFileSync(path, 'utf8')));
	}
}
